import { getDatabase } from '../database.js';

export interface TokenRecord {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export class TokenRepository {
  // Email verification tokens
  static createVerificationToken(record: TokenRecord): void {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO email_verifications (id, user_id, token, expires_at, used_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(record.id, record.user_id, record.token, record.expires_at, record.used_at, record.created_at);
  }

  static findValidVerificationToken(token: string): TokenRecord | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    const row = db.prepare(`
      SELECT * FROM email_verifications
      WHERE token = ? AND used_at IS NULL AND expires_at > ?
    `).get(token, now);
    return (row as TokenRecord) || null;
  }

  static markVerificationTokenUsed(tokenId: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare('UPDATE email_verifications SET used_at = ? WHERE id = ?').run(now, tokenId);
  }

  // Password reset tokens
  static createPasswordResetToken(record: TokenRecord): void {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO password_resets (id, user_id, token, expires_at, used_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(record.id, record.user_id, record.token, record.expires_at, record.used_at, record.created_at);
  }

  static findValidPasswordResetToken(token: string): TokenRecord | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    const row = db.prepare(`
      SELECT * FROM password_resets
      WHERE token = ? AND used_at IS NULL AND expires_at > ?
    `).get(token, now);
    return (row as TokenRecord) || null;
  }

  static markPasswordResetTokenUsed(tokenId: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare('UPDATE password_resets SET used_at = ? WHERE id = ?').run(now, tokenId);
  }
}
