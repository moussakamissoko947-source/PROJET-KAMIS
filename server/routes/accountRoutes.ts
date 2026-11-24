import { Router, Response } from 'express';
import { authRequired, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { AuthService } from '../services/authService.js';
import { FileService } from '../services/fileService.js';
import { FileRepository } from '../db/repositories/fileRepository.js';
import { AuditService } from '../services/auditService.js';

const router = Router();

router.use(authRequired);

/**
 * GET /api/account
 * Returns account information, storage metrics and breakdown
 */
router.get('/', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = req.user!;
    const usage = FileService.getStorageUsage(user.id);
    const files = FileRepository.listByOwner(user.id);

    // Calculate category breakdown
    const breakdown = {
      documents: { count: 0, bytes: 0 },
      images: { count: 0, bytes: 0 },
      videos: { count: 0, bytes: 0 },
      audio: { count: 0, bytes: 0 },
      archives: { count: 0, bytes: 0 },
      others: { count: 0, bytes: 0 }
    };

    for (const file of files) {
      const mime = file.content_type_claimed.toLowerCase();
      const ext = file.original_name.split('.').pop()?.toLowerCase() || '';

      if (mime.includes('pdf') || mime.includes('document') || mime.includes('text') || ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
        breakdown.documents.count++;
        breakdown.documents.bytes += file.size_bytes;
      } else if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
        breakdown.images.count++;
        breakdown.images.bytes += file.size_bytes;
      } else if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
        breakdown.videos.count++;
        breakdown.videos.bytes += file.size_bytes;
      } else if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
        breakdown.audio.count++;
        breakdown.audio.bytes += file.size_bytes;
      } else if (mime.includes('zip') || mime.includes('tar') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        breakdown.archives.count++;
        breakdown.archives.bytes += file.size_bytes;
      } else {
        breakdown.others.count++;
        breakdown.others.bytes += file.size_bytes;
      }
    }

    res.json({
      user: {
        id: user.id,
        email: user.email_normalized,
        createdAt: user.created_at,
        emailVerified: !!user.email_verified_at,
        status: user.status
      },
      storage: usage,
      totalFiles: files.length,
      breakdown
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/account/change-password
 */
router.post('/change-password', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = req.user!;
    const { oldPassword, newPassword } = req.body;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await AuthService.changePassword({
      userId: user.id,
      oldPassword,
      newPassword,
      ip,
      userAgent
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/account
 * Completely deletes user account, metadata and physical files
 */
router.delete('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = req.user!;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await AuthService.deleteAccount({
      userId: user.id,
      ip,
      userAgent
    });

    res.clearCookie('kamis_session', { path: '/' });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/account/upgrade-request
 * Records an Orange Money upgrade subscription request
 */
router.post('/upgrade-request', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = req.user!;
    const { planId, planName, planStorage, amountGnf, senderPhone, transactionRef } = req.body;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    console.log(`\n=======================================================`);
    console.log(`  💰 NOUVELLE SOUSCRIPTION ORANGE MONEY REÇUE`);
    console.log(`  👤 Utilisateur  : ${user.email_normalized}`);
    console.log(`  📦 Forfait      : ${planName} (${planStorage})`);
    console.log(`  💵 Montant      : ${amountGnf}`);
    console.log(`  📱 Numéro payeur: ${senderPhone}`);
    console.log(`  📝 Réf SMS OM   : ${transactionRef || 'Non renseignée'}`);
    console.log(`=======================================================\n`);

    AuditService.logUpgradeRequested(
      user.id,
      { planId, planName, planStorage, amountGnf, senderPhone, transactionRef },
      ip,
      userAgent
    );

    res.json({
      success: true,
      message: 'Votre demande de souscription a été enregistrée avec succès.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
