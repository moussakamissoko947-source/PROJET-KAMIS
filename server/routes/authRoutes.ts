import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { authRequired, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { config } from '../config.js';
import { FileService } from '../services/fileService.js';

const router = Router();

// Rate limiters for security
const authLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 15,
  message: 'Trop de tentatives d’authentification. Veuillez patienter une minute.'
});

const passwordResetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Trop de demandes de réinitialisation. Veuillez patienter 15 minutes.'
});

function getBaseUrl(req: Request): string {
  if (config.clientUrl) return config.clientUrl;
  const host = req.get('x-forwarded-host') || req.get('host') || '';
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  return host ? `${proto}://${host}` : '';
}

router.post('/register', authLimiter, async (req: Request, res: Response, next) => {
  try {
    const { email, password, acceptTerms } = req.body;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const baseUrl = getBaseUrl(req);

    const result = await AuthService.register({
      email,
      password,
      acceptTerms: Boolean(acceptTerms),
      ip,
      userAgent,
      baseUrl
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/verify-email', async (req: Request, res: Response, next) => {
  try {
    const { token } = req.body;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await AuthService.verifyEmail({ token, ip, userAgent });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/resend-verification', authLimiter, async (req: Request, res: Response, next) => {
  try {
    const { email } = req.body;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const baseUrl = getBaseUrl(req);

    const result = await AuthService.resendVerificationEmail({ email, ip, userAgent, baseUrl });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/dev-verify', async (req: Request, res: Response, next) => {
  try {
    const { email } = req.body;
    const result = await AuthService.devInstantVerify(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/login', authLimiter, async (req: Request, res: Response, next) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { sessionToken, user } = await AuthService.login({
      email,
      password,
      ip,
      userAgent
    });

    // Set secure HTTP-only cookie
    res.cookie(config.cookieName, sessionToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: config.sessionExpiryDays * 24 * 60 * 60 * 1000,
      path: '/'
    });

    const usage = FileService.getStorageUsage(user.id);

    res.json({
      user,
      storage: usage,
      token: sessionToken // also returned for clients preferring Authorization header
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req: Request, res: Response, next) => {
  try {
    const token = req.cookies?.[config.cookieName] || (req.headers.authorization?.split(' ')[1]);
    if (token) {
      AuthService.logout(token);
    }
    res.clearCookie(config.cookieName, { path: '/' });
    res.json({ success: true, message: 'Déconnexion réussie.' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authRequired, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = req.user!;
    const usage = FileService.getStorageUsage(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email_normalized,
        emailVerified: !!user.email_verified_at,
        createdAt: user.created_at
      },
      storage: usage
    });
  } catch (err) {
    next(err);
  }
});

router.post('/password-reset/request', passwordResetLimiter, async (req: Request, res: Response, next) => {
  try {
    const { email } = req.body;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const baseUrl = getBaseUrl(req);

    const result = await AuthService.requestPasswordReset({ email, ip, userAgent, baseUrl });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/password-reset/confirm', passwordResetLimiter, async (req: Request, res: Response, next) => {
  try {
    const { token, newPassword } = req.body;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await AuthService.confirmPasswordReset({ token, newPassword, ip, userAgent });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
