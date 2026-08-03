import type { Request, Response, NextFunction } from 'express';
import { getSessionUser } from './session.js';
import type { UserRow } from '../services/authService.js';

export interface AuthedRequest extends Request {
  user?: UserRow;
}

// Exige sessão válida (cookie httpOnly salvo no banco). Anexa req.user.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });
  (req as AuthedRequest).user = user;
  next();
}
