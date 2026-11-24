import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import { config } from '../config.js';
import { FileRepository, FileRecord, UserStorageUsage } from '../db/repositories/fileRepository.js';
import { storage } from './storageService.js';
import { AuditService } from './auditService.js';

export class FileService {
  /**
   * Sanitizes original client filename to prevent directory traversal or control char issues.
   * Client-provided name is NEVER used on filesystem (we use random UUID object keys).
   */
  static sanitizeFilename(rawName: string): string {
    if (!rawName || typeof rawName !== 'string') {
      return 'fichier-sans-nom';
    }
    // Remove null bytes and path traversal patterns
    let clean = rawName.replace(/\0/g, '').replace(/[/\\?%*:|"<>]/g, '_');
    clean = clean.trim();
    if (clean.length === 0) {
      clean = 'document';
    }
    // Limit filename length to 255 chars
    if (clean.length > 255) {
      const ext = path.extname(clean);
      const base = path.basename(clean, ext);
      clean = base.substring(0, 255 - ext.length) + ext;
    }
    return clean;
  }

  static async uploadFile(params: {
    ownerUserId: string;
    originalName: string;
    mimeType: string;
    buffer: Buffer;
    ip?: string;
    userAgent?: string;
  }): Promise<FileRecord> {
    const { ownerUserId, originalName, mimeType, buffer, ip, userAgent } = params;
    const sizeBytes = buffer.length;

    // PR-FIL-02: Size validation
    if (sizeBytes > config.maxFileSizeBytes) {
      throw new Error(`Le fichier dépasse la taille maximale autorisée (${Math.round(config.maxFileSizeBytes / (1024 * 1024))} MiB).`);
    }

    if (sizeBytes === 0) {
      throw new Error('Le fichier est vide (0 octet).');
    }

    // PR-FIL-06: Quota check
    const usage = FileRepository.getOrCreateStorageUsage(ownerUserId, config.defaultQuotaBytes);
    if (usage.used_bytes + sizeBytes > usage.quota_bytes) {
      const available = Math.max(0, usage.quota_bytes - usage.used_bytes);
      AuditService.logQuotaExceeded(ownerUserId, sizeBytes, available, ip, userAgent);
      throw new Error(`Espace insuffisant. Votre quota de stockage est atteint ou serait dépassé par cet envoi.`);
    }

    const safeOriginalName = this.sanitizeFilename(originalName);
    const objectKey = uuidv4();
    const fileId = uuidv4();
    const now = new Date().toISOString();

    // 1. Write file to private storage
    await storage.save(objectKey, buffer);

    // 2. Insert metadata record in DB
    const fileRecord = FileRepository.create({
      id: fileId,
      owner_user_id: ownerUserId,
      original_name: safeOriginalName,
      object_key: objectKey,
      content_type_claimed: mimeType || 'application/octet-stream',
      size_bytes: sizeBytes,
      checksum: null,
      state: 'ready',
      created_at: now
    });

    // 3. Atomically adjust user storage usage
    FileRepository.adjustStorageUsage(ownerUserId, sizeBytes);

    // 4. Record audit log
    AuditService.logFileUpload(ownerUserId, fileId, sizeBytes, safeOriginalName, ip, userAgent);

    return fileRecord;
  }

  static listFiles(
    userId: string,
    options?: {
      search?: string;
      category?: string;
      sortBy?: 'date' | 'name' | 'size';
      sortOrder?: 'asc' | 'desc';
    }
  ): FileRecord[] {
    return FileRepository.listByOwner(userId, options);
  }

  static getStorageUsage(userId: string): UserStorageUsage {
    return FileRepository.getOrCreateStorageUsage(userId, config.defaultQuotaBytes);
  }

  static async getFileForDownload(params: {
    fileId: string;
    userId: string;
    ip?: string;
    userAgent?: string;
  }): Promise<{ file: FileRecord; stream: Readable }> {
    const { fileId, userId, ip, userAgent } = params;

    const file = FileRepository.findByIdAndOwner(fileId, userId);
    if (!file) {
      // Check if file exists under another owner to detect and log cross-tenant attack
      AuditService.logCrossTenantDenied(userId, fileId, ip, userAgent);
      throw new Error('Fichier introuvable.');
    }

    const stream = storage.getStream(file.object_key);
    AuditService.logFileDownload(userId, fileId, ip, userAgent);

    return { file, stream };
  }

  static async getFileForPreview(params: {
    fileId: string;
    userId: string;
    ip?: string;
    userAgent?: string;
  }): Promise<{ file: FileRecord; stream: Readable }> {
    const { fileId, userId, ip, userAgent } = params;

    const file = FileRepository.findByIdAndOwner(fileId, userId);
    if (!file) {
      AuditService.logCrossTenantDenied(userId, fileId, ip, userAgent);
      throw new Error('Fichier introuvable.');
    }

    const stream = storage.getStream(file.object_key);
    return { file, stream };
  }

  static async deleteFile(params: {
    fileId: string;
    userId: string;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    const { fileId, userId, ip, userAgent } = params;

    const file = FileRepository.findByIdAndOwner(fileId, userId);
    if (!file) {
      AuditService.logCrossTenantDenied(userId, fileId, ip, userAgent);
      throw new Error('Fichier introuvable.');
    }

    // Mark as deleting
    FileRepository.updateState(fileId, 'deleting');

    // Remove from physical storage
    await storage.delete(file.object_key);

    // Adjust quota
    FileRepository.adjustStorageUsage(userId, -file.size_bytes);

    // Delete record from database
    FileRepository.delete(fileId);

    // Audit log
    AuditService.logFileDelete(userId, fileId, ip, userAgent);
  }
}
