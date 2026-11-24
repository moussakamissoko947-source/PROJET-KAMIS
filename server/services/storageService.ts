import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { config } from '../config.js';

export interface StorageProvider {
  save(key: string, data: Buffer): Promise<void>;
  getStream(key: string): Readable;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getSize(key: string): Promise<number>;
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = path.resolve(baseDir || config.storageDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolveSafePath(key: string): string {
    // Sanitize key to prevent path traversal
    const safeKey = path.basename(key);
    const targetPath = path.join(this.baseDir, safeKey);
    
    // Security check: ensure path remains within baseDir
    if (!targetPath.startsWith(this.baseDir)) {
      throw new Error('Tentative de traversée de chemin non autorisée');
    }
    return targetPath;
  }

  async save(key: string, data: Buffer): Promise<void> {
    const filePath = this.resolveSafePath(key);
    await fs.promises.writeFile(filePath, data);
  }

  getStream(key: string): Readable {
    const filePath = this.resolveSafePath(key);
    if (!fs.existsSync(filePath)) {
      throw new Error('Fichier introuvable sur le stockage');
    }
    return fs.createReadStream(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolveSafePath(key);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.resolveSafePath(key);
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getSize(key: string): Promise<number> {
    const filePath = this.resolveSafePath(key);
    const stat = await fs.promises.stat(filePath);
    return stat.size;
  }
}

export const storage = new LocalStorageProvider();
