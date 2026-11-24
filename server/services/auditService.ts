import { AuditRepository } from '../db/repositories/auditRepository.js';

export class AuditService {
  static logAuthSuccess(userId: string, email: string, ip?: string, userAgent?: string): void {
    AuditRepository.record({
      user_id: userId,
      action: 'AUTH_LOGIN_SUCCESS',
      ip_address: ip,
      user_agent: userAgent,
      metadata: { email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') }
    });
  }

  static logAuthFailed(email: string, reason: string, ip?: string, userAgent?: string): void {
    AuditRepository.record({
      action: 'AUTH_LOGIN_FAILED',
      ip_address: ip,
      user_agent: userAgent,
      metadata: { email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), reason }
    });
  }

  static logRegister(userId: string, ip?: string, userAgent?: string): void {
    AuditRepository.record({
      user_id: userId,
      action: 'AUTH_REGISTER',
      ip_address: ip,
      user_agent: userAgent
    });
  }

  static logEmailVerified(userId: string, ip?: string, userAgent?: string): void {
    AuditRepository.record({
      user_id: userId,
      action: 'AUTH_EMAIL_VERIFIED',
      ip_address: ip,
      user_agent: userAgent
    });
  }

  static logPasswordResetRequest(ip?: string, userAgent?: string): void {
    AuditRepository.record({
      action: 'AUTH_PASSWORD_RESET_REQUESTED',
      ip_address: ip,
      user_agent: userAgent
    });
  }

  static logPasswordResetSuccess(userId: string, ip?: string, userAgent?: string): void {
    AuditRepository.record({
      user_id: userId,
      action: 'AUTH_PASSWORD_RESET_COMPLETED',
      ip_address: ip,
      user_agent: userAgent
    });
  }

  static logUpgradeRequested(userId: string, details: Record<string, any>, ip?: string, userAgent?: string): void {
    AuditRepository.record({
      user_id: userId,
      action: 'UPGRADE_PAYMENT_SUBMITTED',
      ip_address: ip,
      user_agent: userAgent,
      metadata: details
    });
  }

  static logFileUpload(userId: string, fileId: string, sizeBytes: number, originalName: string, ip?: string, userAgent?: string): void {
    AuditRepository.record({
      user_id: userId,
      action: 'FILE_UPLOADED',
      ip_address: ip,
      user_agent: userAgent,
      metadata: { file_id: fileId, size_bytes: sizeBytes, filename_length: originalName.length }
    });
  }

  static logFileDownload(userId: string, fileId: string, ip?: string, userAgent?: string): void {
    AuditRepository.record({
      user_id: userId,
      action: 'FILE_DOWNLOADED',
      ip_address: ip,
      user_agent: userAgent,
      metadata: { file_id: fileId }
    });
  }

  static logFileDelete(userId: string, fileId: string, ip?: string, userAgent?: string): void {
    AuditRepository.record({
      user_id: userId,
      action: 'FILE_DELETED',
      ip_address: ip,
      user_agent: userAgent,
      metadata: { file_id: fileId }
    });
  }

  static logQuotaExceeded(userId: string, attemptedBytes: number, availableBytes: number, ip?: string, userAgent?: string): void {
    AuditRepository.record({
      user_id: userId,
      action: 'SECURITY_QUOTA_EXCEEDED',
      ip_address: ip,
      user_agent: userAgent,
      metadata: { attempted_bytes: attemptedBytes, available_bytes: availableBytes }
    });
  }

  static logCrossTenantDenied(userId: string, targetFileId: string, ip?: string, userAgent?: string): void {
    AuditRepository.record({
      user_id: userId,
      action: 'SECURITY_CROSS_TENANT_DENIED',
      ip_address: ip,
      user_agent: userAgent,
      metadata: { attempted_file_id: targetFileId }
    });
  }
}
