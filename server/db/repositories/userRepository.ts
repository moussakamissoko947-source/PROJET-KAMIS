import { getDatabase } from '../database.js';

export interface UserRecord {
  id: string;
  email_normalized: string;
  password_hash: string;
  email_verified_at: string | null;
  status: 'active' | 'suspended' | 'deletion_requested';
  created_at: string;
  updated_at: string;
}

export class UserRepository {
  static create(user: Omit<UserRecord, 'updated_at'>): UserRecord {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO users (id, email_normalized, password_hash, email_verified_at, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      user.id,
      user.email_normalized,
      user.password_hash,
      user.email_verified_at,
      user.status,
      user.created_at,
      now
    );

    return { ...user, updated_at: now };
  }

  static findById(id: string): UserRecord | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return (row as UserRecord) || null;
  }

  static findByEmail(email: string): UserRecord | null {
    const db = getDatabase();
    const normalized = email.trim().toLowerCase();
    const row = db.prepare('SELECT * FROM users WHERE email_normalized = ?').get(normalized);
    return (row as UserRecord) || null;
  }

  static markEmailVerified(userId: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?').run(now, now, userId);
  }

  static updatePassword(userId: string, newPasswordHash: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newPasswordHash, now, userId);
  }

  static delete(userId: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  }
}
