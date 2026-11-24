import { Router, Response } from 'express';
import multer from 'multer';
import { authRequired, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { FileService } from '../services/fileService.js';
import { config } from '../config.js';

const router = Router();

// Multer memory storage with file size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSizeBytes
  }
});

// All file routes require authentication
router.use(authRequired);

/**
 * GET /api/files
 * List all files belonging to authenticated user
 */
router.get('/', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = req.user!;
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const sortBy = req.query.sortBy as 'date' | 'name' | 'size' | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

    const files = FileService.listFiles(user.id, {
      search,
      category,
      sortBy,
      sortOrder
    });

    const storageUsage = FileService.getStorageUsage(user.id);

    res.json({
      files,
      storage: storageUsage
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/files/upload
 * Upload a single file (can be called multiple times for multi-file upload)
 */
router.post('/upload', upload.single('file'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = req.user!;
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier fourni dans la requête.' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Originalname can come with utf-8 encoding
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    const fileRecord = await FileService.uploadFile({
      ownerUserId: user.id,
      originalName: originalName || req.file.originalname,
      mimeType: req.file.mimetype,
      buffer: req.file.buffer,
      ip,
      userAgent
    });

    const updatedStorage = FileService.getStorageUsage(user.id);

    res.status(201).json({
      file: fileRecord,
      storage: updatedStorage,
      message: 'Fichier téléversé avec succès.'
    });
  } catch (err: any) {
    // Multer size error handling
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        error: `Le fichier dépasse la taille maximale autorisée (${Math.round(config.maxFileSizeBytes / (1024 * 1024))} MiB).`
      });
      return;
    }
    next(err);
  }
});

/**
 * GET /api/files/:id/download
 * Download file with Content-Disposition: attachment
 */
router.get('/:id/download', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = req.user!;
    const fileId = req.params.id as string;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { file, stream } = await FileService.getFileForDownload({
      fileId,
      userId: user.id,
      ip,
      userAgent
    });

    // Format safe Content-Disposition with RFC 5987 UTF-8 support
    const encodedFilename = encodeURIComponent(file.original_name);
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name.replace(/"/g, '')}"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Type', file.content_type_claimed || 'application/octet-stream');
    res.setHeader('Content-Length', file.size_bytes);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/files/:id/preview
 * Stream file inline for previews (images, audio, video, text, PDF)
 */
router.get('/:id/preview', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = req.user!;
    const fileId = req.params.id as string;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { file, stream } = await FileService.getFileForPreview({
      fileId,
      userId: user.id,
      ip,
      userAgent
    });

    const isViewableInline = 
      file.content_type_claimed.startsWith('image/') ||
      file.content_type_claimed.startsWith('video/') ||
      file.content_type_claimed.startsWith('audio/') ||
      file.content_type_claimed.includes('pdf') ||
      file.content_type_claimed.startsWith('text/');

    const disposition = isViewableInline ? 'inline' : 'attachment';

    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Type', file.content_type_claimed || 'application/octet-stream');
    res.setHeader('Content-Length', file.size_bytes);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/files/:id
 * Delete file idempotently
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = req.user!;
    const fileId = req.params.id as string;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await FileService.deleteFile({
      fileId,
      userId: user.id,
      ip,
      userAgent
    });

    const updatedStorage = FileService.getStorageUsage(user.id);

    res.json({
      success: true,
      message: 'Fichier supprimé définitivement.',
      storage: updatedStorage
    });
  } catch (err) {
    next(err);
  }
});

export default router;
