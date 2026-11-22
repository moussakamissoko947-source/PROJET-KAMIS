import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isTest: process.env.NODE_ENV === 'test',
  
  // Database & Storage paths
  dataDir: path.resolve(process.cwd(), process.env.DATA_DIR || 'data'),
  dbPath: path.resolve(process.cwd(), process.env.DB_PATH || 'data/kamis_docs.db'),
  storageDir: path.resolve(process.cwd(), process.env.STORAGE_DIR || 'data/storage'),
  
  // Storage Quota limits
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES || String(100 * 1024 * 1024), 10), // 100 MiB
  defaultQuotaBytes: parseInt(process.env.DEFAULT_QUOTA_BYTES || String(5 * 1024 * 1024 * 1024), 10), // 5 GiB
  
  // Security & Sessions
  cookieName: 'kamis_session',
  sessionExpiryDays: 7,
  verificationExpiryHours: 24,
  passwordResetExpiryMinutes: 60,
  bcryptSaltRounds: 12,
  
  // App URLs (dynamiquement adaptés à l'hôte public si non définis)
  clientUrl: process.env.CLIENT_URL || '',
  apiUrl: process.env.API_URL || '',
  
  // Email (Optional SMTP)
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Kamis Docs <no-reply@kamisdocs.local>'
  }
};
