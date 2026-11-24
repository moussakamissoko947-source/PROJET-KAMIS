import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';
import { SessionRepository } from '../db/repositories/sessionRepository.js';
import { UserRepository, UserRecord } from '../db/repositories/userRepository.js';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
  sessionId?: string;
}

export function authRequired(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // 1. Check HTTP-only cookie
  let token = req.cookies?.[config.cookieName];

  // 2. Fallback to Authorization: Bearer <token>
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Session non authentifiée. Veuillez vous connecter.' });
    return;
  }

  const session = SessionRepository.findActiveById(token);
  if (!session) {
    // Clear invalid cookie
    res.clearCookie(config.cookieName);
    res.status(401).json({ error: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
    return;
  }

  const user = UserRepository.findById(session.user_id);
  if (!user || user.status !== 'active') {
    res.clearCookie(config.cookieName);
    res.status(401).json({ error: 'Compte inactif ou introuvable.' });
    return;
  }

  req.user = user;
  req.sessionId = session.id;
  next();
}
