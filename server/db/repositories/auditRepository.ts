import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';

export interface AuditRecord {
  id?: string;
  user_id?: string | null;
  action: string;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

export class AuditRepository {
  static record(entry: AuditRecord): void {
    try {
      const db = getDatabase();
      const id = entry.id || uuidv4();
      const now = entry.created_at || new Date().toISOString();
      const metadataStr = entry.metadata ? JSON.stringify(entry.metadata) : null;

      db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, ip_address, user_agent, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        entry.user_id || null,
        entry.action,
        entry.ip_address || null,
        entry.user_agent || null,
        metadataStr,
        now
      );
    } catch (err) {
      // In production audit logging failures should be handled gracefully without crashing the main request
      console.error('Failed to write audit log:', err);
    }
  }

  static getRecentLogs(limit = 100): Array<{
    id: string;
    user_id: string | null;
    action: string;
    ip_address: string | null;
    user_agent: string | null;
    metadata: string | null;
    created_at: string;
  }> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit);
    return rows as any[];
  }
}
