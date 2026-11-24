import { Router, Request, Response } from 'express';
import { mailService } from '../services/mailService.js';
import { config } from '../config.js';

const router = Router();

// Health check endpoint (PRD / TRD Section 11 & 6)
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    product: 'Kamis Docs',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Dev mailbox routes (only active in dev mode)
router.get('/dev/mailbox', (req: Request, res: Response) => {
  if (config.nodeEnv === 'production') {
    res.status(404).json({ error: 'Non disponible en production' });
    return;
  }
  res.json({
    emails: mailService.getDevMailbox()
  });
});

router.post('/dev/mailbox/clear', (req: Request, res: Response) => {
  if (config.nodeEnv === 'production') {
    res.status(404).json({ error: 'Non disponible en production' });
    return;
  }
  mailService.clearDevMailbox();
  res.json({ success: true });
});

export default router;
