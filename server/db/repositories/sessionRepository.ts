import { getDatabase } from '../database.js';

export interface SessionRecord {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  user_agent: string | null;
  ip_address: string | null;
}

export class SessionRepository {
  static create(session: SessionRecord): SessionRecord {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO sessions (id, user_id, created_at, expires_at, revoked_at, user_agent, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      session.id,
      session.user_id,
      session.created_at,
      session.expires_at,
      session.revoked_at,
      session.user_agent,
      session.ip_address
    );
    return session;
  }

  static findActiveById(id: string): SessionRecord | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    const row = db.prepare(`
      SELECT * FROM sessions 
      WHERE id = ? AND revoked_at IS NULL AND expires_at > ?
    `).get(id, now);
    return (row as SessionRecord) || null;
  }

  static revoke(id: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ?').run(now, id);
  }

  static revokeAllForUser(userId: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(now, userId);
  }

  static deleteExpired(): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare('DELETE FROM sessions WHERE expires_at <= ? OR revoked_at IS NOT NULL').run(now);
  }
}
