import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SESSION_SECRET || 'hackathon-ai-secret-key-2026-vsb-dept';

export interface UserPayload {
  role: 'admin' | 'team';
  id?: number;
  username?: string;
  teamCode?: string;
  teamName?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  const cookieToken = req.cookies?.hackathon_token;
  const token = bearerToken || cookieToken;

  if (!token) {
    req.user = undefined;
    return next();
  }

  const payload = verifyToken(token);
  if (payload) {
    req.user = payload;
  } else {
    req.user = undefined;
  }
  next();
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  authenticateToken(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }
    next();
  });
}

export function requireTeam(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  authenticateToken(req, res, () => {
    if (!req.user || req.user.role !== 'team') {
      res.status(403).json({ error: 'Forbidden: Team access required' });
      return;
    }
    next();
  });
}
