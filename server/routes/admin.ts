import { Router, Response } from 'express';
import { query, queryOne, run } from '../database/db.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { broadcastStateUpdate, broadcastAnnouncement, broadcastProblemsRevealed, broadcastProblemsReset, broadcastAllocationUpdate, getSystemState } from '../socket/index.js';

const router = Router();

// Apply requireAdmin to all routes in this router
router.use(requireAdmin);

// GET /api/admin/state
router.get('/state', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hackathon = await queryOne('SELECT * FROM hackathon_state WHERE id = 1');
    const announcements = await query('SELECT * FROM announcements ORDER BY id DESC LIMIT 20');
    
    // Problems with slot counts
    const problems = await query(`
      SELECT 
        p.*,
        COUNT(s.id) as total_slots,
        SUM(CASE WHEN s.consumed = 1 THEN 1 ELSE 0 END) as consumed_slots
      FROM problem_statements p
      LEFT JOIN allocation_slots s ON p.id = s.problem_id
      GROUP BY p.id
      ORDER BY p.id ASC
    `);

    // All 20 teams with selection details
    const teams = await query(`
      SELECT 
        t.id, 
        t.team_code, 
        t.team_name, 
        t.selected_problem_id, 
        t.selected_at,
        p.problem_code,
        p.title as problem_title
      FROM teams t
      LEFT JOIN problem_statements p ON t.selected_problem_id = p.id
      ORDER BY t.id ASC
    `);

    // Allocation slots details (which team has which slot)
    const slots = await query(`
      SELECT 
        s.id,
        s.problem_id,
        s.slot_number,
        s.consumed,
        s.assigned_team_id,
        s.assigned_at,
        t.team_code,
        t.team_name,
        p.problem_code
      FROM allocation_slots s
      LEFT JOIN teams t ON s.assigned_team_id = t.id
      LEFT JOIN problem_statements p ON s.problem_id = p.id
      ORDER BY s.problem_id ASC, s.slot_number ASC
    `);

    return res.json({
      hackathon,
      announcements,
      problems,
      teams,
      slots,
      serverTime: Date.now()
    });
  } catch (err: any) {
    console.error('Admin get state error:', err);
    return res.status(500).json({ error: 'Failed to retrieve admin state' });
  }
});

// POST /api/admin/timer/start
router.post('/timer/start', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = Date.now();
    const DURATION_8_HOURS_MS = 8 * 60 * 60 * 1000;
    const endTime = now + DURATION_8_HOURS_MS;

    await run(`
      UPDATE hackathon_state 
      SET status = 'ACTIVE',
          start_time = ?,
          end_time = ?,
          paused_at = NULL,
          paused_duration = 0,
          current_phase = 'DISCOVER',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, [now, endTime]);

    const updatedState = await queryOne('SELECT * FROM hackathon_state WHERE id = 1');
    broadcastStateUpdate({ hackathon: updatedState });

    return res.json({ success: true, hackathon: updatedState });
  } catch (err: any) {
    console.error('Timer start error:', err);
    return res.status(500).json({ error: 'Failed to start timer' });
  }
});

// POST /api/admin/timer/pause
router.post('/timer/pause', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const state = await queryOne('SELECT * FROM hackathon_state WHERE id = 1');
    if (!state || state.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Timer is not currently active' });
    }

    const now = Date.now();
    await run(`
      UPDATE hackathon_state 
      SET status = 'PAUSED',
          paused_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, [now]);

    const updatedState = await queryOne('SELECT * FROM hackathon_state WHERE id = 1');
    broadcastStateUpdate({ hackathon: updatedState });

    return res.json({ success: true, hackathon: updatedState });
  } catch (err: any) {
    console.error('Timer pause error:', err);
    return res.status(500).json({ error: 'Failed to pause timer' });
  }
});

// POST /api/admin/timer/resume
router.post('/timer/resume', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const state = await queryOne('SELECT * FROM hackathon_state WHERE id = 1');
    if (!state || state.status !== 'PAUSED') {
      return res.status(400).json({ error: 'Timer is not paused' });
    }

    const now = Date.now();
    const pausedTime = state.paused_at ? now - state.paused_at : 0;
    const newPausedDuration = (state.paused_duration || 0) + pausedTime;
    const newEndTime = (state.end_time || (now + 8 * 3600 * 1000)) + pausedTime;

    await run(`
      UPDATE hackathon_state 
      SET status = 'ACTIVE',
          end_time = ?,
          paused_at = NULL,
          paused_duration = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, [newEndTime, newPausedDuration]);

    const updatedState = await queryOne('SELECT * FROM hackathon_state WHERE id = 1');
    broadcastStateUpdate({ hackathon: updatedState });

    return res.json({ success: true, hackathon: updatedState });
  } catch (err: any) {
    console.error('Timer resume error:', err);
    return res.status(500).json({ error: 'Failed to resume timer' });
  }
});

// POST /api/admin/timer/reset
router.post('/timer/reset', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await run(`
      UPDATE hackathon_state 
      SET status = 'SETUP',
          start_time = NULL,
          end_time = NULL,
          paused_at = NULL,
          paused_duration = 0,
          current_phase = 'DISCOVER',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    const updatedState = await queryOne('SELECT * FROM hackathon_state WHERE id = 1');
    broadcastStateUpdate({ hackathon: updatedState });

    return res.json({ success: true, hackathon: updatedState });
  } catch (err: any) {
    console.error('Timer reset error:', err);
    return res.status(500).json({ error: 'Failed to reset timer' });
  }
});

// POST /api/admin/phase/set
router.post('/phase/set', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phase } = req.body;
    const allowed = ['DISCOVER', 'BUILD', 'TEST', 'PITCH', 'COMPLETED'];
    if (!allowed.includes(phase)) {
      return res.status(400).json({ error: `Invalid phase. Must be one of: ${allowed.join(', ')}` });
    }

    await run(`
      UPDATE hackathon_state 
      SET current_phase = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, [phase]);

    const updatedState = await queryOne('SELECT * FROM hackathon_state WHERE id = 1');
    broadcastStateUpdate({ hackathon: updatedState });

    return res.json({ success: true, hackathon: updatedState });
  } catch (err: any) {
    console.error('Phase update error:', err);
    return res.status(500).json({ error: 'Failed to update phase' });
  }
});

// POST /api/admin/problems/reveal
router.post('/problems/reveal', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentState = await queryOne('SELECT problems_revealed FROM hackathon_state WHERE id = 1');
    if (currentState && currentState.problems_revealed === 1) {
      return res.status(400).json({ error: 'Problem statements are already revealed. Reset reveal first if re-authorization is needed.' });
    }

    await run('UPDATE problem_statements SET is_revealed = 1');
    await run('UPDATE hackathon_state SET problems_revealed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = 1');

    // Add announcement
    const announcementMsg = 'SYSTEM ALERT: Problem Statements are now officially unlocked! All teams may initiate Challenge Discovery via the 3D Bowl Shuffle.';
    await run('INSERT INTO announcements (message) VALUES (?)', [announcementMsg]);

    const newAnnouncement = await queryOne('SELECT * FROM announcements ORDER BY id DESC LIMIT 1');
    broadcastAnnouncement(newAnnouncement);
    broadcastProblemsRevealed();

    const systemState = await getSystemState();
    broadcastStateUpdate(systemState);

    return res.json({ success: true, message: 'All problem statements have been revealed' });
  } catch (err: any) {
    console.error('Reveal problems error:', err);
    return res.status(500).json({ error: 'Failed to reveal problem statements' });
  }
});

// POST /api/admin/problems/reset-reveal
router.post('/problems/reset-reveal', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentState = await queryOne('SELECT problems_revealed FROM hackathon_state WHERE id = 1');
    if (!currentState || currentState.problems_revealed === 0) {
      return res.status(400).json({ error: 'Problem statements are not currently in a revealed state' });
    }

    // Safely reset reveal flag on problem statements and hackathon state (preserves all team allocations & timer)
    await run('UPDATE problem_statements SET is_revealed = 0');
    await run('UPDATE hackathon_state SET problems_revealed = 0, updated_at = CURRENT_TIMESTAMP WHERE id = 1');

    // Add administrative announcement
    const announcementMsg = 'SYSTEM NOTICE: Problem Statement reveal state has been reset by Admin. System is armed and ready for official reveal authorization.';
    await run('INSERT INTO announcements (message) VALUES (?)', [announcementMsg]);

    const newAnnouncement = await queryOne('SELECT * FROM announcements ORDER BY id DESC LIMIT 1');
    broadcastAnnouncement(newAnnouncement);
    broadcastProblemsReset();

    const systemState = await getSystemState();
    broadcastStateUpdate(systemState);

    return res.json({ 
      success: true, 
      message: 'Problem Statement reveal state has been reset successfully. Ready for next reveal.' 
    });
  } catch (err: any) {
    console.error('Reset reveal problems error:', err);
    return res.status(500).json({ error: 'Failed to reset problem statements reveal state' });
  }
});

// GET /api/admin/problems
router.get('/problems', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const problems = await query('SELECT * FROM problem_statements ORDER BY id ASC');
    return res.json({ problems });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// PUT /api/admin/problems/:id
router.put('/problems/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, category, description, requirements, expected_output, evaluation_focus } = req.body;

    await run(`
      UPDATE problem_statements 
      SET title = ?, category = ?, description = ?, requirements = ?, 
          expected_output = ?, evaluation_focus = ?
      WHERE id = ?
    `, [title, category, description, requirements, expected_output, evaluation_focus, id]);

    const updated = await queryOne('SELECT * FROM problem_statements WHERE id = ?', [id]);
    return res.json({ success: true, problem: updated });
  } catch (err: any) {
    console.error('Update problem error:', err);
    return res.status(500).json({ error: 'Failed to update problem statement' });
  }
});

// GET /api/admin/teams
router.get('/teams', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teams = await query(`
      SELECT 
        t.id, 
        t.team_code, 
        t.team_name, 
        t.selected_problem_id, 
        t.selected_at,
        p.problem_code,
        p.title as problem_title,
        p.category as problem_category
      FROM teams t
      LEFT JOIN problem_statements p ON t.selected_problem_id = p.id
      ORDER BY t.id ASC
    `);
    return res.json({ teams });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// POST /api/admin/teams - Create a new team
router.post('/teams', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { team_code, team_name, password } = req.body;
    if (!team_code || !team_name || !password) {
      return res.status(400).json({ error: 'Team code, team name, and password are required' });
    }

    const code = team_code.trim().toUpperCase();
    const existing = await queryOne('SELECT id FROM teams WHERE UPPER(team_code) = ?', [code]);
    if (existing) {
      return res.status(409).json({ error: `Team code ${code} already exists.` });
    }

    const hash = await import('bcryptjs').then(b => b.default.hash(password, 10));
    await run(
      'INSERT INTO teams (team_code, team_name, password_hash) VALUES (?, ?, ?)',
      [code, team_name.trim(), hash]
    );

    const newTeam = await queryOne('SELECT id, team_code, team_name, created_at FROM teams WHERE UPPER(team_code) = ?', [code]);
    return res.status(201).json({ success: true, team: newTeam });
  } catch (err: any) {
    console.error('Create team error:', err);
    return res.status(500).json({ error: 'Failed to create team' });
  }
});

// PUT /api/admin/teams/:id - Update team credentials or name
router.put('/teams/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { team_name, password } = req.body;

    if (password && password.trim().length > 0) {
      const hash = await import('bcryptjs').then(b => b.default.hash(password, 10));
      await run('UPDATE teams SET team_name = ?, password_hash = ? WHERE id = ?', [team_name.trim(), hash, id]);
    } else {
      await run('UPDATE teams SET team_name = ? WHERE id = ?', [team_name.trim(), id]);
    }

    const updated = await queryOne('SELECT id, team_code, team_name FROM teams WHERE id = ?', [id]);
    return res.json({ success: true, team: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update team' });
  }
});

// DELETE /api/admin/teams/:id - Delete team
router.delete('/teams/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    // Release any claimed allocation slot
    await run('UPDATE allocation_slots SET consumed = 0, assigned_team_id = NULL, assigned_at = NULL WHERE assigned_team_id = ?', [id]);
    await run('DELETE FROM selection_logs WHERE team_id = ?', [id]);
    await run('DELETE FROM teams WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Team removed successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete team' });
  }
});

// POST /api/admin/problems - Create problem statement with 4 allocation slots
router.post('/problems', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { problem_code, title, category, description, requirements, expected_output, evaluation_focus } = req.body;
    if (!problem_code || !title || !description) {
      return res.status(400).json({ error: 'Problem code, title, and description are required.' });
    }

    const code = problem_code.trim().toUpperCase();
    const existing = await queryOne('SELECT id FROM problem_statements WHERE UPPER(problem_code) = ?', [code]);
    if (existing) {
      return res.status(409).json({ error: `Problem code ${code} already exists.` });
    }

    const isRevealedState = await queryOne('SELECT problems_revealed FROM hackathon_state WHERE id = 1');
    const isRevealed = isRevealedState?.problems_revealed ? 1 : 0;

    await run(`
      INSERT INTO problem_statements (problem_code, title, category, description, requirements, expected_output, evaluation_focus, is_revealed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [code, title, category || 'AI / ML', description, requirements || '', expected_output || '', evaluation_focus || '', isRevealed]);

    const createdProb = await queryOne('SELECT * FROM problem_statements WHERE UPPER(problem_code) = ?', [code]);

    // Create 4 allocation slots
    if (createdProb) {
      for (let s = 1; s <= 4; s++) {
        await run('INSERT INTO allocation_slots (problem_id, slot_number, consumed) VALUES (?, ?, 0)', [createdProb.id, s]);
      }
    }

    return res.status(201).json({ success: true, problem: createdProb });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create problem statement' });
  }
});

// POST /api/admin/announcements
router.post('/announcements', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Announcement message is required' });
    }

    await run('INSERT INTO announcements (message) VALUES (?)', [message.trim()]);
    const newAnnouncement = await queryOne('SELECT * FROM announcements ORDER BY id DESC LIMIT 1');

    broadcastAnnouncement(newAnnouncement);

    return res.json({ success: true, announcement: newAnnouncement });
  } catch (err: any) {
    console.error('Create announcement error:', err);
    return res.status(500).json({ error: 'Failed to send announcement' });
  }
});

export default router;
