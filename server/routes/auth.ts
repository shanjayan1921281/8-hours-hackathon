import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne } from '../database/db.js';
import { signToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = await queryOne('SELECT * FROM admins WHERE username = ?', [username.trim()]);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const payload = { role: 'admin' as const, id: admin.id, username: admin.username };
    const token = signToken(payload);

    res.cookie('hackathon_token', token, COOKIE_OPTIONS);
    return res.json({
      success: true,
      token,
      user: {
        role: 'admin',
        username: admin.username
      }
    });
  } catch (err: any) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Internal server error during admin login' });
  }
});

// Team Login
router.post('/team/login', async (req, res) => {
  try {
    const { teamCode, password } = req.body;
    if (!teamCode || !password) {
      return res.status(400).json({ error: 'Team code and password are required' });
    }

    const normalizedCode = teamCode.trim().toUpperCase();
    const team = await queryOne('SELECT * FROM teams WHERE UPPER(team_code) = ?', [normalizedCode]);
    if (!team) {
      return res.status(401).json({ error: 'Invalid team code or password' });
    }

    const isMatch = await bcrypt.compare(password, team.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid team code or password' });
    }

    const payload = {
      role: 'team' as const,
      id: team.id,
      teamCode: team.team_code,
      teamName: team.team_name
    };
    const token = signToken(payload);

    res.cookie('hackathon_token', token, COOKIE_OPTIONS);
    return res.json({
      success: true,
      token,
      user: {
        role: 'team',
        id: team.id,
        teamCode: team.team_code,
        teamName: team.team_name,
        selectedProblemId: team.selected_problem_id,
        selectedAt: team.selected_at
      }
    });
  } catch (err: any) {
    console.error('Team login error:', err);
    return res.status(500).json({ error: 'Internal server error during team login' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('hackathon_token');
  return res.json({ success: true, message: 'Logged out successfully' });
});

// Me endpoint
router.get('/me', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.json({ user: null });
  }

  if (req.user.role === 'admin') {
    return res.json({
      user: {
        role: 'admin',
        username: req.user.username
      }
    });
  }

  if (req.user.role === 'team' && req.user.id) {
    const team = await queryOne(
      `SELECT t.id, t.team_code, t.team_name, t.selected_problem_id, t.selected_at,
              p.problem_code, p.title as problem_title, p.category as problem_category
       FROM teams t
       LEFT JOIN problem_statements p ON t.selected_problem_id = p.id
       WHERE t.id = ?`,
      [req.user.id]
    );

    if (!team) {
      return res.json({ user: null });
    }

    return res.json({
      user: {
        role: 'team',
        id: team.id,
        teamCode: team.team_code,
        teamName: team.team_name,
        selectedProblemId: team.selected_problem_id,
        selectedAt: team.selected_at,
        assignedProblem: team.selected_problem_id ? {
          code: team.problem_code,
          title: team.problem_title,
          category: team.problem_category
        } : null
      }
    });
  }

  return res.json({ user: null });
});

export default router;
