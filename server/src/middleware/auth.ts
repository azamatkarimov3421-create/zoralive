import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../db/database';

export interface AuthRequest extends Request {
  user?: Record<string, any>;
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '14d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, config.jwtSecret) as { userId: string };
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
    return;
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Token yaroqsiz yoki muddati tugagan' });
    return;
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
  if (!user) {
    res.status(401).json({ error: 'Foydalanuvchi topilmadi' });
    return;
  }
  if (user.is_banned) {
    res.status(403).json({ error: 'Akkauntingiz bloklangan' });
    return;
  }
  req.user = user;
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Faqat Super Admin ruxsatiga ega' });
      return;
    }
    next();
  });
}
