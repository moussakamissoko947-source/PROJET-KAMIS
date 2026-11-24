import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { UserRepository, UserRecord } from '../db/repositories/userRepository.js';
import { SessionRepository, SessionRecord } from '../db/repositories/sessionRepository.js';
import { TokenRepository } from '../db/repositories/tokenRepository.js';
import { FileRepository } from '../db/repositories/fileRepository.js';
import { storage } from './storageService.js';
import { mailService } from './mailService.js';
import { AuditService } from './auditService.js';

export class AuthService {
  static async register(params: {
    email: string;
    password: string;
    acceptTerms: boolean;
    ip?: string;
    userAgent?: string;
    baseUrl?: string;
  }): Promise<{ message: string; requiresVerification: boolean; email: string; activationLink?: string }> {
    const { email, password, acceptTerms, ip, userAgent, baseUrl } = params;

    if (!acceptTerms) {
      throw new Error('Vous devez accepter les conditions générales d’utilisation.');
    }

    if (!email || !email.includes('@')) {
      throw new Error('Adresse e-mail invalide.');
    }

    const emailNormalized = email.trim().toLowerCase();

    if (!password || password.length < 8) {
      throw new Error('Le mot de passe doit comporter au moins 8 caractères.');
    }

    const existingUser = UserRepository.findByEmail(emailNormalized);
    if (existingUser) {
      // PR-ACC-01 / Non-revealing or explicit duplicate check
      // To prevent user enumeration while keeping UX clear:
      throw new Error('Cette adresse e-mail est déjà associée à un compte.');
    }

    const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);
    const userId = uuidv4();
    const now = new Date().toISOString();

    const user = UserRepository.create({
      id: userId,
      email_normalized: emailNormalized,
      password_hash: passwordHash,
      email_verified_at: null,
      status: 'active',
      created_at: now
    });

    // Initialize quota entry
    FileRepository.getOrCreateStorageUsage(userId, config.defaultQuotaBytes);

    // Create single-use verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + config.verificationExpiryHours * 60 * 60 * 1000).toISOString();

    TokenRepository.createVerificationToken({
      id: uuidv4(),
      user_id: userId,
      token,
      expires_at: expiresAt,
      used_at: null,
      created_at: now
    });

    // Audit log
    AuditService.logRegister(userId, ip, userAgent);

    // Send verification email with dynamic base URL
    await mailService.sendVerificationEmail(emailNormalized, token, baseUrl);

    const activationLink = `/verify-email?token=${encodeURIComponent(token)}`;

    return {
      message: 'Compte créé avec succès. Un e-mail de confirmation vous a été envoyé.',
      requiresVerification: true,
      email: emailNormalized,
      activationLink
    };
  }

  static async verifyEmail(params: {
    token: string;
    ip?: string;
    userAgent?: string;
  }): Promise<{ success: boolean; message: string }> {
    const { token, ip, userAgent } = params;

    if (!token || typeof token !== 'string') {
      throw new Error('Jeton de vérification manquant ou invalide.');
    }

    const tokenRecord = TokenRepository.findValidVerificationToken(token);
    if (!tokenRecord) {
      throw new Error('Ce lien de confirmation est invalide ou a expiré.');
    }

    UserRepository.markEmailVerified(tokenRecord.user_id);
    TokenRepository.markVerificationTokenUsed(tokenRecord.id);

    AuditService.logEmailVerified(tokenRecord.user_id, ip, userAgent);

    return {
      success: true,
      message: 'Votre adresse e-mail a été confirmée avec succès. Vous pouvez maintenant vous connecter.'
    };
  }

  static async resendVerificationEmail(params: {
    email: string;
    ip?: string;
    userAgent?: string;
    baseUrl?: string;
  }): Promise<{ message: string; activationLink?: string }> {
    const { email, baseUrl } = params;
    const emailNormalized = email.trim().toLowerCase();
    const user = UserRepository.findByEmail(emailNormalized);

    if (user && !user.email_verified_at) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + config.verificationExpiryHours * 60 * 60 * 1000).toISOString();

      TokenRepository.createVerificationToken({
        id: uuidv4(),
        user_id: user.id,
        token,
        expires_at: expiresAt,
        used_at: null,
        created_at: new Date().toISOString()
      });

      await mailService.sendVerificationEmail(user.email_normalized, token, baseUrl);
      return {
        message: 'Un nouveau lien de confirmation a été généré.',
        activationLink: `/verify-email?token=${encodeURIComponent(token)}`
      };
    }

    return { message: 'Si un compte non vérifié existe pour cette adresse, un nouveau lien a été envoyé.' };
  }

  static async devInstantVerify(email: string): Promise<{ success: boolean; message: string }> {
    const emailNormalized = email ? email.trim().toLowerCase() : '';
    const user = UserRepository.findByEmail(emailNormalized);
    if (!user) {
      throw new Error('Aucun compte trouvé avec cette adresse.');
    }
    UserRepository.markEmailVerified(user.id);
    return { success: true, message: 'Votre adresse e-mail a été confirmée avec succès.' };
  }

  static async login(params: {
    email: string;
    password: string;
    ip?: string;
    userAgent?: string;
  }): Promise<{ sessionToken: string; user: { id: string; email: string; emailVerified: boolean } }> {
    const { email, password, ip, userAgent } = params;
    const emailNormalized = email ? email.trim().toLowerCase() : '';

    const genericError = 'Identifiants invalides (adresse e-mail ou mot de passe incorrect).';

    if (!emailNormalized || !password) {
      AuditService.logAuthFailed(emailNormalized, 'EMPTY_CREDENTIALS', ip, userAgent);
      throw new Error(genericError);
    }

    const user = UserRepository.findByEmail(emailNormalized);
    if (!user) {
      AuditService.logAuthFailed(emailNormalized, 'USER_NOT_FOUND', ip, userAgent);
      throw new Error(genericError);
    }

    if (user.status !== 'active') {
      AuditService.logAuthFailed(emailNormalized, 'ACCOUNT_SUSPENDED', ip, userAgent);
      throw new Error('Ce compte a été suspendu ou désactivé.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      AuditService.logAuthFailed(emailNormalized, 'INVALID_PASSWORD', ip, userAgent);
      throw new Error(genericError);
    }

    if (!user.email_verified_at) {
      AuditService.logAuthFailed(emailNormalized, 'EMAIL_NOT_VERIFIED', ip, userAgent);
      const error: any = new Error('Votre adresse e-mail n’a pas encore été vérifiée. Veuillez consulter votre boîte de réception ou demander un nouveau lien.');
      error.code = 'EMAIL_NOT_VERIFIED';
      throw error;
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.sessionExpiryDays * 24 * 60 * 60 * 1000).toISOString();

    SessionRepository.create({
      id: sessionToken,
      user_id: user.id,
      created_at: now.toISOString(),
      expires_at: expiresAt,
      revoked_at: null,
      user_agent: userAgent || null,
      ip_address: ip || null
    });

    AuditService.logAuthSuccess(user.id, user.email_normalized, ip, userAgent);

    return {
      sessionToken,
      user: {
        id: user.id,
        email: user.email_normalized,
        emailVerified: !!user.email_verified_at
      }
    };
  }

  static async logout(sessionToken: string): Promise<void> {
    if (sessionToken) {
      SessionRepository.revoke(sessionToken);
    }
  }

  static async requestPasswordReset(params: {
    email: string;
    ip?: string;
    userAgent?: string;
    baseUrl?: string;
  }): Promise<{ message: string; activationLink?: string }> {
    const { email, ip, userAgent, baseUrl } = params;
    AuditService.logPasswordResetRequest(ip, userAgent);

    const emailNormalized = email ? email.trim().toLowerCase() : '';
    const user = UserRepository.findByEmail(emailNormalized);

    // Non-revealing: always respond with the same friendly message
    if (user && user.status === 'active') {
      const token = crypto.randomBytes(32).toString('hex');
      const now = new Date();
      const expiresAt = new Date(now.getTime() + config.passwordResetExpiryMinutes * 60 * 1000).toISOString();

      TokenRepository.createPasswordResetToken({
        id: uuidv4(),
        user_id: user.id,
        token,
        expires_at: expiresAt,
        used_at: null,
        created_at: now.toISOString()
      });

      await mailService.sendPasswordResetEmail(user.email_normalized, token, baseUrl);
    }

    return {
      message: 'Si cette adresse correspond à un compte actif, vous recevrez un lien de réinitialisation d’ici quelques instants.'
    };
  }

  static async confirmPasswordReset(params: {
    token: string;
    newPassword: string;
    ip?: string;
    userAgent?: string;
  }): Promise<{ message: string }> {
    const { token, newPassword, ip, userAgent } = params;

    if (!token || !newPassword) {
      throw new Error('Paramètres manquants.');
    }

    if (newPassword.length < 8) {
      throw new Error('Le nouveau mot de passe doit comporter au moins 8 caractères.');
    }

    const resetRecord = TokenRepository.findValidPasswordResetToken(token);
    if (!resetRecord) {
      throw new Error('Ce lien de réinitialisation est invalide ou a expiré.');
    }

    const newHash = await bcrypt.hash(newPassword, config.bcryptSaltRounds);
    UserRepository.updatePassword(resetRecord.user_id, newHash);
    TokenRepository.markPasswordResetTokenUsed(resetRecord.id);

    // Revoke all existing sessions for security
    SessionRepository.revokeAllForUser(resetRecord.user_id);

    AuditService.logPasswordResetSuccess(resetRecord.user_id, ip, userAgent);

    return {
      message: 'Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.'
    };
  }

  static async changePassword(params: {
    userId: string;
    oldPassword: string;
    newPassword: string;
    ip?: string;
    userAgent?: string;
  }): Promise<{ message: string }> {
    const { userId, oldPassword, newPassword, ip, userAgent } = params;

    const user = UserRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur introuvable.');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      throw new Error('L’ancien mot de passe est incorrect.');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new Error('Le nouveau mot de passe doit comporter au moins 8 caractères.');
    }

    const newHash = await bcrypt.hash(newPassword, config.bcryptSaltRounds);
    UserRepository.updatePassword(userId, newHash);

    return { message: 'Mot de passe mis à jour avec succès.' };
  }

  static async deleteAccount(params: {
    userId: string;
    ip?: string;
    userAgent?: string;
  }): Promise<{ message: string }> {
    const { userId, ip, userAgent } = params;

    const user = UserRepository.findById(userId);
    if (!user) {
      throw new Error('Compte introuvable.');
    }

    // Delete all user files from physical storage
    const files = FileRepository.listByOwner(userId);
    for (const file of files) {
      try {
        await storage.delete(file.object_key);
      } catch (err) {
        console.warn(`Impossible de supprimer l'objet ${file.object_key} du stockage:`, err);
      }
    }

    // Deleting user cascades to files, sessions, tokens, storage usage in SQLite
    UserRepository.delete(userId);

    return { message: 'Votre compte et l’ensemble de vos fichiers ont été définitivement supprimés.' };
  }
}
