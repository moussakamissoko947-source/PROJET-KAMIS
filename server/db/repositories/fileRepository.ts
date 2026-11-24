import { getDatabase } from '../database.js';

export interface FileRecord {
  id: string;
  owner_user_id: string;
  original_name: string;
  object_key: string;
  content_type_claimed: string;
  size_bytes: number;
  checksum: string | null;
  state: 'pending' | 'ready' | 'deleting' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface UserStorageUsage {
  user_id: string;
  used_bytes: number;
  quota_bytes: number;
  updated_at: string;
}

export class FileRepository {
  static create(file: Omit<FileRecord, 'updated_at'>): FileRecord {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO files (id, owner_user_id, original_name, object_key, content_type_claimed, size_bytes, checksum, state, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      file.id,
      file.owner_user_id,
      file.original_name,
      file.object_key,
      file.content_type_claimed,
      file.size_bytes,
      file.checksum,
      file.state,
      file.created_at,
      now
    );
    return { ...file, updated_at: now };
  }

  static findByIdAndOwner(id: string, ownerUserId: string): FileRecord | null {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT * FROM files 
      WHERE id = ? AND owner_user_id = ? AND state != 'deleting'
    `).get(id, ownerUserId);
    return (row as FileRecord) || null;
  }

  static listByOwner(
    ownerUserId: string,
    options?: {
      search?: string;
      category?: string;
      sortBy?: 'date' | 'name' | 'size';
      sortOrder?: 'asc' | 'desc';
    }
  ): FileRecord[] {
    const db = getDatabase();
    let query = `SELECT * FROM files WHERE owner_user_id = ? AND state = 'ready'`;
    const params: (string | number)[] = [ownerUserId];

    if (options?.search && options.search.trim() !== '') {
      query += ` AND original_name LIKE ?`;
      params.push(`%${options.search.trim()}%`);
    }

    if (options?.category && options.category !== 'all') {
      const cat = options.category.toLowerCase();
      if (cat === 'documents') {
        query += ` AND (content_type_claimed LIKE '%pdf%' OR content_type_claimed LIKE '%word%' OR content_type_claimed LIKE '%document%' OR content_type_claimed LIKE '%text%' OR original_name LIKE '%.pdf' OR original_name LIKE '%.docx' OR original_name LIKE '%.doc' OR original_name LIKE '%.txt')`;
      } else if (cat === 'images') {
        query += ` AND (content_type_claimed LIKE 'image/%' OR original_name LIKE '%.png' OR original_name LIKE '%.jpg' OR original_name LIKE '%.jpeg' OR original_name LIKE '%.gif' OR original_name LIKE '%.webp' OR original_name LIKE '%.svg')`;
      } else if (cat === 'videos') {
        query += ` AND (content_type_claimed LIKE 'video/%' OR original_name LIKE '%.mp4' OR original_name LIKE '%.webm' OR original_name LIKE '%.mov' OR original_name LIKE '%.mkv')`;
      } else if (cat === 'audio') {
        query += ` AND (content_type_claimed LIKE 'audio/%' OR original_name LIKE '%.mp3' OR original_name LIKE '%.wav' OR original_name LIKE '%.ogg' OR original_name LIKE '%.flac')`;
      } else if (cat === 'archives') {
        query += ` AND (content_type_claimed LIKE '%zip%' OR content_type_claimed LIKE '%tar%' OR content_type_claimed LIKE '%rar%' OR content_type_claimed LIKE '%7z%' OR original_name LIKE '%.zip' OR original_name LIKE '%.tar%' OR original_name LIKE '%.rar' OR original_name LIKE '%.7z')`;
      }
    }

    let orderClause = 'ORDER BY created_at DESC';
    const order = options?.sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (options?.sortBy === 'name') {
      orderClause = `ORDER BY original_name COLLATE NOCASE ${order}`;
    } else if (options?.sortBy === 'size') {
      orderClause = `ORDER BY size_bytes ${order}`;
    } else if (options?.sortBy === 'date') {
      orderClause = `ORDER BY created_at ${order}`;
    }

    query += ` ${orderClause}`;

    const rows = db.prepare(query).all(...params);
    return rows as FileRecord[];
  }

  static updateState(id: string, state: FileRecord['state']): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare('UPDATE files SET state = ?, updated_at = ? WHERE id = ?').run(state, now, id);
  }

  static delete(id: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM files WHERE id = ?').run(id);
  }

  // Quota & Storage usage methods
  static getOrCreateStorageUsage(userId: string, defaultQuotaBytes: number): UserStorageUsage {
    const db = getDatabase();
    let row = db.prepare('SELECT * FROM user_storage_usage WHERE user_id = ?').get(userId) as UserStorageUsage | undefined;
    if (!row) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO user_storage_usage (user_id, used_bytes, quota_bytes, updated_at)
        VALUES (?, 0, ?, ?)
      `).run(userId, defaultQuotaBytes, now);
      row = {
        user_id: userId,
        used_bytes: 0,
        quota_bytes: defaultQuotaBytes,
        updated_at: now
      };
    }
    return row;
  }

  static adjustStorageUsage(userId: string, deltaBytes: number): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE user_storage_usage 
      SET used_bytes = MAX(0, used_bytes + ?), updated_at = ?
      WHERE user_id = ?
    `).run(deltaBytes, now, userId);
  }

  static recalculateStorageUsage(userId: string): number {
    const db = getDatabase();
    const sumRow = db.prepare(`
      SELECT COALESCE(SUM(size_bytes), 0) AS total_used 
      FROM files 
      WHERE owner_user_id = ? AND state = 'ready'
    `).get(userId) as { total_used: number };

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE user_storage_usage 
      SET used_bytes = ?, updated_at = ?
      WHERE user_id = ?
    `).run(sumRow.total_used, now, userId);

    return sumRow.total_used;
  }
}
