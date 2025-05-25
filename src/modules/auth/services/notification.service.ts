import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  sendPasswordResetSuccess(email: string) {
    // In production, send email/SMS
    this.logger.log(`Password reset success notification sent to: ${email}`);
  }

  sendPasswordResetOtp(email: string, otp: string) {
    // In production, send OTP via email/SMS
    this.logger.log(`Password reset OTP sent to: ${email} (OTP: ${otp})`);
  }
  
  /**
   * Send account recovery email for existing accounts with token
   * @param email The user's email
   * @param token The recovery token to include in the email
   */
  sendAccountRecoveryEmail(email: string, token: string) {
    // In production, send email with recovery link
    this.logger.log(`Account recovery link sent to: ${email} (Token: ${token})`);
    // Example recovery link that would be sent: https://frontend.com/recover?token=${token}
  }

  /**
   * Send generic recovery attempt notification
   * This is used for non-existent accounts to prevent account enumeration
   * @param email The email address to send the notification to
   */
  sendGenericRecoveryAttemptEmail(email: string) {
    // In production, send a generic notification that doesn't reveal if the account exists
    this.logger.log(`Generic recovery attempt notification sent to: ${email}`);
    // The email would say something like:
    // "A recovery attempt was made for this email. If this was not you, you can ignore this message.
    // If you do not have an account with us, no action is needed."
  }

  /**
   * Send account recovery notification regardless of account existence
   * @param email The email address to notify
   * @param token The recovery token (only provided for existing accounts)
   * @param accountExists Whether the account exists in the system
   */
  sendRecoveryNotification(email: string, token?: string, accountExists: boolean = false) {
    if (accountExists && token) {
      this.sendAccountRecoveryEmail(email, token);
    } else {
      this.sendGenericRecoveryAttemptEmail(email);
    }
    
    // Log the notification attempt for audit purposes
    this.logger.log(`Recovery notification sent to ${email} (account exists: ${accountExists})`);
  }

  sendAccountRecoverySuccess(email: string) {
    // In production, send email confirmation
    this.logger.log(`Account recovery success notification sent to: ${email}`);
  }
}