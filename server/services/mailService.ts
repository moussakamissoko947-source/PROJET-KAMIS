import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config.js';

export interface SentEmail {
  id: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  type: 'verification' | 'password_reset' | 'notification';
  actionUrl?: string;
  sentAt: string;
}

class MailService {
  private transporter: Transporter | null = null;
  // Circular in-memory buffer of recent emails for dev testing / preview
  private devMailbox: SentEmail[] = [];
  private maxDevMailboxSize = 25;

  constructor() {
    if (config.smtp.host && config.smtp.user) {
      try {
        this.transporter = nodemailer.createTransport({
          host: config.smtp.host,
          port: config.smtp.port,
          secure: config.smtp.secure,
          auth: {
            user: config.smtp.user,
            pass: config.smtp.pass
          }
        });
      } catch (err) {
        console.warn('Configuration SMTP invalide, bascule vers la boîte de développement.');
      }
    }
  }

  getDevMailbox(): SentEmail[] {
    return [...this.devMailbox];
  }

  clearDevMailbox(): void {
    this.devMailbox = [];
  }

  private recordDevEmail(email: SentEmail): void {
    this.devMailbox.unshift(email);
    if (this.devMailbox.length > this.maxDevMailboxSize) {
      this.devMailbox.pop();
    }
  }

  async sendVerificationEmail(to: string, token: string, baseUrl?: string): Promise<void> {
    const rootUrl = (baseUrl || config.clientUrl || '').replace(/\/$/, '');
    const verifyUrl = `${rootUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const subject = 'Kamis Docs — Confirmez votre adresse e-mail';
    const text = `Bienvenue sur Kamis Docs !\n\nVeuillez confirmer votre adresse e-mail en cliquant sur le lien suivant :\n${verifyUrl}\n\nCe lien expirera dans ${config.verificationExpiryHours} heures.\nSi vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message.`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">Bienvenue sur Kamis Docs</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Merci de vous être inscrit sur Kamis Docs, votre coffre-fort de documents et fichiers privé et sécurisé.
        </p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Cliquez sur le bouton ci-dessous pour valider votre adresse e-mail :
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            Confirmer mon adresse e-mail
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          Ou copiez ce lien dans votre navigateur :<br/>
          <a href="${verifyUrl}" style="color: #2563eb; word-break: break-all;">${verifyUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">
          Ce lien expirera dans ${config.verificationExpiryHours} heures. Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer ce message.
        </p>
      </div>
    `;

    const emailRecord: SentEmail = {
      id: Math.random().toString(36).substring(2, 11),
      to,
      subject,
      text,
      html,
      type: 'verification',
      actionUrl: verifyUrl,
      sentAt: new Date().toISOString()
    };

    this.recordDevEmail(emailRecord);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: config.smtp.from,
          to,
          subject,
          text,
          html
        });
      } catch (err) {
        console.error('Erreur lors de l’envoi du courriel SMTP:', err);
      }
    } else {
      console.log(`[MAIL DEV] Courriel de vérification envoyé à ${to}`);
      console.log(`[MAIL DEV] Lien d'activation: ${verifyUrl}`);
    }
  }

  async sendPasswordResetEmail(to: string, token: string, baseUrl?: string): Promise<void> {
    const rootUrl = (baseUrl || config.clientUrl || '').replace(/\/$/, '');
    const resetUrl = `${rootUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const subject = 'Kamis Docs — Réinitialisation de votre mot de passe';
    const text = `Vous avez demandé la réinitialisation de votre mot de passe Kamis Docs.\n\nCliquez sur ce lien pour choisir un nouveau mot de passe :\n${resetUrl}\n\nCe lien expirera dans ${config.passwordResetExpiryMinutes} minutes.\nSi vous n'êtes pas à l'origine de cette demande, aucune action n'est requise.`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">Réinitialisation de mot de passe</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Kamis Docs.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          Ou copiez ce lien :<br/>
          <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">
          Ce lien est valable ${config.passwordResetExpiryMinutes} minutes. Si vous n'avez pas demandé cette réinitialisation, votre compte reste sécurisé.
        </p>
      </div>
    `;

    const emailRecord: SentEmail = {
      id: Math.random().toString(36).substring(2, 11),
      to,
      subject,
      text,
      html,
      type: 'password_reset',
      actionUrl: resetUrl,
      sentAt: new Date().toISOString()
    };

    this.recordDevEmail(emailRecord);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: config.smtp.from,
          to,
          subject,
          text,
          html
        });
      } catch (err) {
        console.error('Erreur lors de l’envoi SMTP de réinitialisation:', err);
      }
    } else {
      console.log(`[MAIL DEV] Courriel de réinitialisation envoyé à ${to}`);
      console.log(`[MAIL DEV] Lien de réinitialisation: ${resetUrl}`);
    }
  }
}

export const mailService = new MailService();
