import { Injectable, Logger } from '@nestjs/common';

interface NotificationOptions {
  email: string;
  token?: string;
  otp?: string;
  accountExists?: boolean;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * Send notification for successful password reset
   * @param email - User's email address
   */
  sendPasswordResetSuccess(email: string): void {
    // In production, send email/SMS
    this.logger.log(`Password reset success notification sent to: ${email}`);
  }

  /**
   * Send one-time password for password reset
   * @param email - User's email address
   * @param otp - One-time password code
   */
  sendPasswordResetOtp(email: string, otp: string): void {
    // In production, send OTP via email/SMS
    this.logger.log(`Password reset OTP sent to: ${email} (OTP: ${otp})`);
  }

  /**
   * Send account recovery email for existing accounts with token
   * @param email - User's email address
   * @param token - Recovery token to include in the email
   */
  sendAccountRecoveryEmail(email: string, token: string): void {
    // In production, send email with recovery link
    this.logger.log(
      `Account recovery link sent to: ${email} (Token: ${token})`,
    );
    // Example recovery link that would be sent: https://frontend.com/recover?token=${token}
  }

  /**
   * Send generic recovery attempt notification
   * This is used for non-existent accounts to prevent account enumeration
   * @param email - Email address to send the notification to
   */
  sendGenericRecoveryAttemptEmail(email: string): void {
    // In production, send a generic notification that doesn't reveal if the account exists
    this.logger.log(`Generic recovery attempt notification sent to: ${email}`);
    // The email would say something like:
    // "A recovery attempt was made for this email. If this was not you, you can ignore this message.
    // If you do not have an account with us, no action is needed."
  }

  /**
   * Send account recovery notification regardless of account existence
   * @param options - Notification options containing email, token, and account status
   * @param options.email - Email address to notify
   * @param options.token - Recovery token (only provided for existing accounts)
   * @param options.accountExists - Whether the account exists in the system
   */
  sendRecoveryNotification(options: NotificationOptions): void {
    const { email, token, accountExists = false } = options;

    if (accountExists && token) {
      this.sendAccountRecoveryEmail(email, token);
    } else {
      this.sendGenericRecoveryAttemptEmail(email);
    }

    // Log the notification attempt for audit purposes
    this.logger.log(
      `Recovery notification sent to ${email} (account exists: ${accountExists})`,
    );
  }

  /**
   * Send notification for successful account recovery
   * @param email - User's email address
   */
  sendAccountRecoverySuccess(email: string): void {
    // In production, send email confirmation
    this.logger.log(`Account recovery success notification sent to: ${email}`);
  }
}
