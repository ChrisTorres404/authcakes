import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import { AuditLogService } from './audit-log.service';
import { NotificationService } from './notification.service';
import { PasswordHistoryService } from './password-history.service';
import { SettingsService } from '../../settings/services/settings.service';
import { ConfigService } from '@nestjs/config';
import { TenantsService } from '../../tenants/services/tenants.service';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly isProduction: boolean;

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationService: NotificationService,
    private readonly passwordHistoryService: PasswordHistoryService,
    private readonly settingsService: SettingsService,
    private readonly configService: ConfigService,
    private readonly tenantsService: TenantsService,
  ) {
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
  }

  // User login with local strategy, with account lock and failed attempt tracking
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    // eslint-disable-next-line no-console
    console.log('[validateUser] Lookup for email:', email, 'Result:', user);
    if (!user) {
      // Track failed attempt (do not reveal user existence)
      await this.usersService.recordFailedLoginAttempt(email);
      // eslint-disable-next-line no-console
      console.log('[validateUser] Login failed: user not found');
      throw new UnauthorizedException('Invalid credentials');
    }
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      // eslint-disable-next-line no-console
      console.log('[validateUser] Login failed: account locked until', user.lockedUntil);
      throw new ForbiddenException('Account is locked. Try again later.');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    // eslint-disable-next-line no-console
    console.log('[validateUser] Password match:', isMatch);
    if (!isMatch) {
      await this.usersService.recordFailedLoginAttempt(user.id);
      // eslint-disable-next-line no-console
      console.log('[validateUser] Login failed: password mismatch');
      throw new UnauthorizedException('Invalid credentials');
    }
    // Reset failed attempts and update last login
    await this.usersService.resetFailedLoginAttempts(user.id);
    await this.usersService.updateLastLogin(user.id);
    // eslint-disable-next-line no-console
    console.log('[validateUser] Login success for user:', user.id);
    return user;
  }

  // Registration flow
  async register(registerDto: any, deviceInfo: any = {}) {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) throw new BadRequestException('Email already in use');
    const user = await this.usersService.create(registerDto);

    // Multi-tenant: If organizationName is provided, create tenant and add user as owner
    let tenant: Tenant | null = null;
    if (registerDto.organizationName) {
      // Generate slug from organizationName
      const slug = registerDto.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      tenant = await this.tenantsService.create({
        name: registerDto.organizationName,
        slug,
        active: true,
      });
      // Add user as owner
      await this.tenantsService.addUserToTenant(user.id, tenant.id, 'owner');
    }

    // Add the initial password to history
    await this.passwordHistoryService.addToHistory(user.id, user.password);

    // Optionally send verification email here
    const verificationToken = await this.requestEmailVerification(user.id);
    // No need to assign user.tenantMemberships here; handled by DB relations
    const tokens = await this.tokenService.generateTokens(user.id, deviceInfo);
    // For development only: include verificationToken in the response
    return { ...tokens, verificationToken };
  }

  // Token refresh logic
  async refresh(userId: string, sessionId: string, deviceInfo: any = {}) {
    // Optionally validate session and user
    return this.tokenService.generateTokens(userId, deviceInfo);
  }

  // Request email verification
  async requestEmailVerification(userId: string) {
    const token = await this.usersService.generateEmailVerificationToken(userId);
    // TODO: Send email with token (integrate with email service)
    return token;
  }

  // Verify email
  async verifyEmail(token: string) {
    return this.usersService.verifyEmail(token);
  }

  // Password reset request (send token)
  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException('User not found');
    // Generate and send password reset token (integrate with email service)
    const token = await this.usersService.generatePasswordResetToken(user.id);
    // Send OTP to user
    const updatedUser = await this.usersService.findById(user.id);
    if (updatedUser.otp) {
      this.notificationService.sendPasswordResetOtp(updatedUser.email, updatedUser.otp);
    }
    return token;
  }

  /**
   * Check if the proposed password exists in the user's password history
   * @param userId The user ID
   * @param newPassword The plaintext new password to check
   * @returns Promise resolving to true if password exists in history
   */
  private async isPasswordInHistory(userId: string, newPassword: string): Promise<boolean> {
    const historyCount = await this.settingsService.getValue('account.password_history_count', 5);
    return this.passwordHistoryService.isPasswordInHistory(userId, newPassword, historyCount);
  }

  // Password reset (using token)
  async resetPassword(token: string, newPassword: string, otp?: string) {
    this.auditLogService.log('password_reset_attempt', { token });
    
    // First verify the token to get the user
    const user = await this.usersService.findByPasswordResetToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }
    
    // Check if password exists in history
    const passwordInHistory = await this.isPasswordInHistory(user.id, newPassword);
    if (passwordInHistory) {
      throw new ConflictException('Cannot reuse a previous password');
    }
    
    // Reset the password
    const updatedUser = await this.usersService.resetPassword(token, newPassword, otp);
    
    // Add the new password to history
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.passwordHistoryService.addToHistory(updatedUser.id, hashedPassword);
    
    await this.sessionService.revokeAllUserSessions(updatedUser.id);
    await this.tokenService.revokeAllUserTokens(updatedUser.id);
    
    this.auditLogService.log('password_reset_success', { userId: updatedUser.id });
    this.notificationService.sendPasswordResetSuccess(updatedUser.email);
    
    return updatedUser;
  }

  // Account recovery request (send token)
  async requestAccountRecovery(email: string) {
    const user = await this.usersService.findByEmail(email);
    let token: string | undefined;
    let accountExists = false;
    
    // Don't reveal if user exists or not for security reasons
    if (user) {
      accountExists = true;
      // Generate account recovery token
      token = await this.usersService.generateAccountRecoveryToken(user.id);
      this.auditLogService.log('account_recovery_requested', { userId: user.id });
    } else {
      this.auditLogService.log('account_recovery_request_nonexistent', { email });
    }
    
    // Send notification regardless of account existence
    this.notificationService.sendRecoveryNotification(email, token, accountExists);
    
    // Return token in development/test environments only
    const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    return { 
      success: true,
      ...(isDev && accountExists && { recoveryToken: token })
    };
  }
  
  // Complete account recovery (using token)
  async completeAccountRecovery(token: string, newPassword: string, mfaCode?: string) {
    this.auditLogService.log('account_recovery_attempt', { token });
    
    // First verify the token to get the user
    const user = await this.usersService.findByRecoveryToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }
    
    // Check MFA if enabled and in production environment
    if (user.mfaEnabled) {
      // Only enforce MFA in production, or if explicitly set to enforce in development
      const shouldEnforceMfa = this.isProduction || 
                              await this.settingsService.getValue('security.enforce_mfa_in_dev', false);
      
      if (shouldEnforceMfa) {
        if (!mfaCode) {
          throw new UnauthorizedException('MFA code is required for account recovery');
        }
        
        const isValidMfa = await this.validateMfaCode(user, mfaCode);
        if (!isValidMfa) {
          this.auditLogService.log('account_recovery_mfa_failed', { 
            userId: user.id, 
            attempt: 'recovery' 
          });
          throw new UnauthorizedException('Invalid MFA code');
        }
      }
    }
    
    // Check if password exists in history
    const passwordInHistory = await this.isPasswordInHistory(user.id, newPassword);
    if (passwordInHistory) {
      throw new ConflictException('Cannot reuse a previous password');
    }
    
    // Complete the recovery process
    const updatedUser = await this.usersService.completeAccountRecovery(token, newPassword);
    
    // Add the new password to history
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.passwordHistoryService.addToHistory(updatedUser.id, hashedPassword);
    
    // Revoke all sessions and tokens for security
    await this.sessionService.revokeAllUserSessions(updatedUser.id);
    await this.tokenService.revokeAllUserTokens(updatedUser.id);
    
    this.auditLogService.log('account_recovery_success', { userId: updatedUser.id });
    this.notificationService.sendAccountRecoverySuccess(updatedUser.email);
    
    return { success: true };
  }

  // Change password (authenticated)
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found');
    
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      this.auditLogService.log('password_change_failed', { 
        userId: user.id, 
        reason: 'incorrect_old_password' 
      });
      throw new UnauthorizedException('Old password is incorrect');
    }
    
    // Check if password exists in history
    const passwordInHistory = await this.isPasswordInHistory(userId, newPassword);
    if (passwordInHistory) {
      this.auditLogService.log('password_change_failed', { 
        userId: user.id, 
        reason: 'password_reuse' 
      });
      throw new ConflictException('Cannot reuse a previous password');
    }
    
    // Hash new password and update
    await this.usersService.update(userId, { password: newPassword });
    
    // Add the new password to history
    await this.passwordHistoryService.addToHistory(userId, newPassword);
    
    this.auditLogService.log('password_changed', { userId });
    
    return { message: 'Password changed successfully' };
  }

  // MFA code validation (supports TOTP and SMS)
  async validateMfaCode(user: any, code: string): Promise<boolean> {
    if (!user.mfaEnabled) return false;
    if (user.mfaType === 'totp') {
      if (!user.mfaSecret) return false;
      return speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: code,
        window: 1,
      });
    } else if (user.mfaType === 'sms') {
      // Assume user.smsMfaCode is set and valid for a short period
      if (!user.smsMfaCode) return false;
      return user.smsMfaCode === code;
    }
    return false;
  }

  async setMfaSecret(userId: string, secret: string) {
    await this.usersService.update(userId, { mfaSecret: secret, mfaEnabled: false, mfaType: 'totp' });
  }

  async getUserById(userId: string) {
    return this.usersService.findById(userId);
  }

  async enableMfa(userId: string) {
    await this.usersService.update(userId, { mfaEnabled: true });
  }
}