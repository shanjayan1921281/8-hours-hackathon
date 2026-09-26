import { Router, Response } from 'express';
import { query, queryOne, run, transaction } from '../database/db.js';
import { requireTeam, AuthenticatedRequest } from '../middleware/auth.js';
import { broadcastAllocationUpdate, broadcastStateUpdate } from '../socket/index.js';

const router = Router();

// Apply requireTeam to team endpoints
router.use(requireTeam);

// GET /api/team/state
router.get('/state', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = req.user?.id;
    if (!teamId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hackathon = await queryOne('SELECT * FROM hackathon_state WHERE id = 1');
    const announcements = await query('SELECT * FROM announcements ORDER BY id DESC LIMIT 15');

    const team = await queryOne(
      `SELECT t.id, t.team_code, t.team_name, t.selected_problem_id, t.selected_at,
              p.problem_code, p.title as problem_title, p.category as problem_category,
              p.description as problem_description, p.requirements as problem_requirements,
              p.expected_output as problem_expected_output, p.evaluation_focus as problem_evaluation_focus
       FROM teams t
       LEFT JOIN problem_statements p ON t.selected_problem_id = p.id
       WHERE t.id = ?`,
      [teamId]
    );

    // Slot counts per problem (for tokens inside the bowl / capacity visualization)
    const slotStats = await query(`
      SELECT 
        p.id, 
        p.problem_code, 
        p.title, 
        p.category,
        COUNT(s.id) as total_slots,
        SUM(CASE WHEN s.consumed = 1 THEN 1 ELSE 0 END) as consumed_slots
      FROM problem_statements p
      LEFT JOIN allocation_slots s ON p.id = s.problem_id
      GROUP BY p.id
      ORDER BY p.id ASC
    `);

    return res.json({
      team,
      hackathon,
      announcements,
      slotStats,
      serverTime: Date.now()
    });
  } catch (err: any) {
    console.error('Team state error:', err);
    return res.status(500).json({ error: 'Failed to retrieve team state' });
  }
});

// POST /api/team/discover - Fair Server-Side Atomic Allocation
router.post('/discover', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = req.user?.id;
    if (!teamId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // 1. Check if team already has selected
    const team = await queryOne('SELECT id, team_code, team_name, selected_problem_id FROM teams WHERE id = ?', [teamId]);
    if (!team) {
      return res.status(404).json({ error: 'Team record not found' });
    }

    if (team.selected_problem_id) {
      return res.status(400).json({ 
        error: 'Challenge already claimed! Each team can discover and claim exactly one challenge.' 
      });
    }

    // 2. Check hackathon state
    const hackathon = await queryOne('SELECT * FROM hackathon_state WHERE id = 1');
    if (!hackathon || hackathon.problems_revealed !== 1) {
      return res.status(403).json({ 
        error: 'Challenges are currently locked. Discovery is only permitted after admin unlocks the challenges.' 
      });
    }

    // 3. Server-side Atomic Transaction for Slot Assignment
    const assignmentResult = await transaction(async (db) => {
      // Find all available unconsumed slots
      // Note: SQLite statement preparation
      const stmt = db.prepare(`
        SELECT s.id as slot_id, s.problem_id, s.slot_number,
               p.id as p_id, p.problem_code, p.title, p.category, 
               p.description, p.requirements, p.expected_output, p.evaluation_focus
        FROM allocation_slots s
        JOIN problem_statements p ON s.problem_id = p.id
        WHERE s.consumed = 0
      `);

      const availableSlots: any[] = [];
      while (stmt.step()) {
        availableSlots.push(stmt.getAsObject());
      }
      stmt.free();

      if (availableSlots.length === 0) {
        throw new Error('ALL_SLOTS_CLAIMED');
      }

      // Secure server-side uniform random selection
      const randomIndex = Math.floor(Math.random() * availableSlots.length);
      const chosen = availableSlots[randomIndex];
      const nowIso = new Date().toISOString();

      // Consume the slot atomically
      db.run(
        'UPDATE allocation_slots SET consumed = 1, assigned_team_id = ?, assigned_at = ? WHERE id = ? AND consumed = 0',
        [teamId, nowIso, chosen.slot_id]
      );

      const modified = db.getRowsModified();
      if (modified === 0) {
        throw new Error('SLOT_RACE_CONFLICT');
      }

      // Update team with selected problem
      db.run(
        'UPDATE teams SET selected_problem_id = ?, selected_at = ? WHERE id = ?',
        [chosen.problem_id, nowIso, teamId]
      );

      // Insert audit selection log
      db.run(
        'INSERT INTO selection_logs (team_id, problem_id, selected_at) VALUES (?, ?, ?)',
        [teamId, chosen.problem_id, nowIso]
      );

      return {
        slotId: chosen.slot_id,
        problemId: chosen.problem_id,
        slotNumber: chosen.slot_number,
        problemCode: chosen.problem_code,
        title: chosen.title,
        category: chosen.category,
        description: chosen.description,
        requirements: chosen.requirements,
        expectedOutput: chosen.expected_output,
        evaluationFocus: chosen.evaluation_focus,
        selectedAt: nowIso
      };
    });

    // Notify all connected clients via Socket.IO
    const slotStats = await query(`
      SELECT 
        p.id, 
        p.problem_code, 
        p.title, 
        COUNT(s.id) as total_slots,
        SUM(CASE WHEN s.consumed = 1 THEN 1 ELSE 0 END) as consumed_slots
      FROM problem_statements p
      LEFT JOIN allocation_slots s ON p.id = s.problem_id
      GROUP BY p.id
    `);

    broadcastAllocationUpdate({
      teamCode: team.team_code,
      teamName: team.team_name,
      problemCode: assignmentResult.problemCode,
      slotStats
    });

    return res.json({
      success: true,
      message: 'Challenge discovered and locked!',
      assignment: assignmentResult
    });
  } catch (err: any) {
    console.error('Discovery allocation error:', err);
    if (err.message === 'ALL_SLOTS_CLAIMED') {
      return res.status(409).json({ error: 'All 20 challenge slots have already been claimed.' });
    }
    if (err.message === 'SLOT_RACE_CONFLICT') {
      return res.status(409).json({ error: 'Slot conflict occurred. Please retry shuffle immediately.' });
    }
    return res.status(500).json({ error: 'Failed to complete challenge assignment' });
  }
});

// GET /api/team/problem
router.get('/problem', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = req.user?.id;
    const team = await queryOne('SELECT selected_problem_id, selected_at FROM teams WHERE id = ?', [teamId]);
    if (!team || !team.selected_problem_id) {
      return res.json({ problem: null });
    }

    const problem = await queryOne(
      'SELECT * FROM problem_statements WHERE id = ?',
      [team.selected_problem_id]
    );

    return res.json({
      problem,
      selectedAt: team.selected_at
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch team problem' });
  }
});

// GET /api/team/announcements
router.get('/announcements', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const announcements = await query('SELECT * FROM announcements ORDER BY id DESC LIMIT 20');
    return res.json({ announcements });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

export default router;
