import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
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
import { User } from '../../users/entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { TenantRole } from '../../tenants/dto/tenant-invitation.dto';
import { DeviceInfo, AuthTokenResponse } from '../interfaces/auth.interfaces';

type MfaType = 'totp' | 'sms';

interface MfaFields {
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaType: MfaType | null;
  smsMfaCode?: string;
}

type UserWithMfa = User & Partial<MfaFields>;

interface AccountRecoveryResponse {
  success: boolean;
  recoveryToken?: string;
  message?: string;
}

/**
 * Type guard to check if user has valid MFA configuration
 * @param user - The user to check MFA configuration for
 * @returns True if user has valid MFA configuration
 */
function hasValidMfaConfig(user: User): user is UserWithMfa {
  return (
    user.mfaEnabled &&
    user.mfaType !== null &&
    (user.mfaType === 'totp' || user.mfaType === 'sms')
  );
}

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
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
  }

  /**
   * Validates user credentials and handles account locking
   * @param email - User's email address
   * @param password - User's password
   * @returns Validated user object
   * @throws UnauthorizedException for invalid credentials
   * @throws ForbiddenException if account is locked
   */
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    console.log('[validateUser] Lookup for email:', email, 'Result:', user);
    if (!user) {
      // Track failed attempt (do not reveal user existence)
      await this.usersService.recordFailedLoginAttempt(email);

      console.log('[validateUser] Login failed: user not found');
      throw new UnauthorizedException('Invalid credentials');
    }
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      console.log(
        '[validateUser] Login failed: account locked until',
        user.lockedUntil,
      );
      throw new ForbiddenException('Account is locked. Try again later.');
    }
    const isMatch = await bcrypt.compare(password, user.password);

    console.log('[validateUser] Password match:', isMatch);
    if (!isMatch) {
      await this.usersService.recordFailedLoginAttempt(user.id);

      console.log('[validateUser] Login failed: password mismatch');
      throw new UnauthorizedException('Invalid credentials');
    }
    // Reset failed attempts and update last login
    await this.usersService.resetFailedLoginAttempts(user.id);
    await this.usersService.updateLastLogin(user.id);

    console.log('[validateUser] Login success for user:', user.id);
    return user;
  }

  /**
   * Handles user registration and initial setup
   * @param registerDto - Registration data
   * @param deviceInfo - Device information for token generation
   * @returns Authentication tokens and user information
   * @throws BadRequestException if email is already in use
   */
  async register(
    registerDto: RegisterDto,
    deviceInfo: DeviceInfo = { ip: '', userAgent: '' },
  ): Promise<AuthTokenResponse> {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) throw new BadRequestException('Email already in use');
    const user = await this.usersService.create(registerDto);

    // Multi-tenant: If organizationName is provided, create tenant and add user as owner
    let tenant: Tenant | null = null;
    if (registerDto.organizationName) {
      // Generate slug from organizationName
      const slug = registerDto.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      tenant = await this.tenantsService.create({
        name: registerDto.organizationName,
        slug,
        active: true,
      });
      // Add user as admin (highest role)
      await this.tenantsService.addUserToTenant(
        user.id,
        tenant.id,
        TenantRole.ADMIN,
      );
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

  /**
   * Refreshes authentication tokens
   * @param userId - User ID
   * @param sessionId - Current session ID
   * @param deviceInfo - Device information for token generation
   * @returns New authentication tokens
   */
  async refresh(
    userId: string,
    sessionId: string,
    deviceInfo: DeviceInfo = { ip: '', userAgent: '' },
  ): Promise<AuthTokenResponse> {
    // Optionally validate session and user
    const tokens = await this.tokenService.generateTokens(userId, deviceInfo);
    return tokens;
  }

  /**
   * Generates and sends email verification token
   * @param userId - User ID to generate verification token for
   * @returns Generated verification token (for development)
   */
  async requestEmailVerification(userId: string): Promise<string> {
    const token =
      await this.usersService.generateEmailVerificationToken(userId);
    // TODO: Send email with token (integrate with email service)
    return token;
  }

  /**
   * Verifies user's email using verification token
   * @param token - Email verification token
   * @returns Updated user object
   * @throws BadRequestException for invalid/expired token
   */
  async verifyEmail(token: string): Promise<User> {
    return this.usersService.verifyEmail(token);
  }

  /**
   * Initiates password reset process
   * @param email - User's email address
   * @returns Generated reset token (for development)
   * @throws BadRequestException if user not found
   */
  async requestPasswordReset(email: string): Promise<string> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException('User not found');
    // Generate and send password reset token (integrate with email service)
    const token = await this.usersService.generatePasswordResetToken(user.id);
    // Send OTP to user
    const updatedUser = await this.usersService.findById(user.id);
    if (updatedUser.otp) {
      this.notificationService.sendPasswordResetOtp(
        updatedUser.email,
        updatedUser.otp,
      );
    }
    return token;
  }

  /**
   * Check if the proposed password exists in the user's password history
   * @param userId The user ID
   * @param newPassword The plaintext new password to check
   * @returns Promise resolving to true if password exists in history
   */
  private async isPasswordInHistory(
    userId: string,
    newPassword: string,
  ): Promise<boolean> {
    const historyCount = await this.settingsService.getValue(
      'account.password_history_count',
      5,
    );
    return this.passwordHistoryService.isPasswordInHistory(
      userId,
      newPassword,
      historyCount,
    );
  }

  /**
   * Resets user's password using reset token
   * @param token - Password reset token
   * @param newPassword - New password to set
   * @param otp - Optional OTP code for verification
   * @returns Updated user object
   * @throws BadRequestException for invalid token
   * @throws ConflictException for password reuse
   */
  async resetPassword(
    token: string,
    newPassword: string,
    otp?: string,
  ): Promise<User> {
    await this.auditLogService.log('password_reset_attempt', { token });

    // First verify the token to get the user
    const user = await this.usersService.findByPasswordResetToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Check if password exists in history
    const passwordInHistory = await this.isPasswordInHistory(
      user.id,
      newPassword,
    );
    if (passwordInHistory) {
      throw new ConflictException('Cannot reuse a previous password');
    }

    // Reset the password
    const updatedUser = await this.usersService.resetPassword(
      token,
      newPassword,
      otp,
    );

    // Add the new password to history
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.passwordHistoryService.addToHistory(
      updatedUser.id,
      hashedPassword,
    );

    await this.sessionService.revokeAllUserSessions(updatedUser.id);
    await this.tokenService.revokeAllUserTokens(updatedUser.id);

    await this.auditLogService.log('password_reset_success', {
      userId: updatedUser.id,
    });
    await this.notificationService.sendPasswordResetSuccess(updatedUser.email);

    return updatedUser;
  }

  /**
   * Initiates account recovery process
   * @param email - User's email address
   * @returns Account recovery response with token (in development)
   */
  async requestAccountRecovery(
    email: string,
  ): Promise<AccountRecoveryResponse> {
    const user = await this.usersService.findByEmail(email);
    let token: string | undefined;
    let accountExists = false;

    // Don't reveal if user exists or not for security reasons
    if (user) {
      accountExists = true;
      // Generate account recovery token
      token = await this.usersService.generateAccountRecoveryToken(user.id);
      await this.auditLogService.log('account_recovery_requested', {
        userId: user.id,
      });
    } else {
      await this.auditLogService.log('account_recovery_request_nonexistent', {
        email,
      });
    }

    // Send notification regardless of account existence
    await this.notificationService.sendRecoveryNotification({
      email,
      token,
      accountExists,
    });

    // Return token in development/test environments only
    const isDev =
      process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    return {
      success: true,
      ...(isDev && accountExists && { recoveryToken: token }),
    };
  }

  /**
   * Completes account recovery process
   * @param token - Recovery token
   * @param newPassword - New password to set
   * @param mfaCode - Optional MFA code for verification
   * @returns Success response
   * @throws BadRequestException for invalid token
   * @throws UnauthorizedException for invalid MFA
   * @throws ConflictException for password reuse
   */
  async completeAccountRecovery(
    token: string,
    newPassword: string,
    mfaCode?: string,
  ): Promise<{ success: boolean }> {
    await this.auditLogService.log('account_recovery_attempt', { token });

    // First verify the token to get the user
    const user = await this.usersService.findByRecoveryToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Check MFA if enabled and in production environment
    if (user.mfaEnabled) {
      // Only enforce MFA in production, or if explicitly set to enforce in development
      const shouldEnforceMfa =
        this.isProduction ||
        (await this.settingsService.getValue(
          'security.enforce_mfa_in_dev',
          false,
        ));

      if (shouldEnforceMfa) {
        if (!mfaCode) {
          throw new UnauthorizedException(
            'MFA code is required for account recovery',
          );
        }

        const isValidMfa = await this.validateMfaCode(user, mfaCode);
        if (!isValidMfa) {
          await this.auditLogService.log('account_recovery_mfa_failed', {
            userId: user.id,
            attempt: 'recovery',
          });
          throw new UnauthorizedException('Invalid MFA code');
        }
      }
    }

    // Check if password exists in history
    const passwordInHistory = await this.isPasswordInHistory(
      user.id,
      newPassword,
    );
    if (passwordInHistory) {
      throw new ConflictException('Cannot reuse a previous password');
    }

    // Complete the recovery process
    const updatedUser = await this.usersService.completeAccountRecovery(
      token,
      newPassword,
    );

    // Add the new password to history
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.passwordHistoryService.addToHistory(
      updatedUser.id,
      hashedPassword,
    );

    // Revoke all sessions and tokens for security
    await this.sessionService.revokeAllUserSessions(updatedUser.id);
    await this.tokenService.revokeAllUserTokens(updatedUser.id);

    await this.auditLogService.log('account_recovery_success', {
      userId: updatedUser.id,
    });
    await this.notificationService.sendAccountRecoverySuccess(
      updatedUser.email,
    );

    return { success: true };
  }

  /**
   * Changes user's password (requires authentication)
   * @param userId - User ID
   * @param oldPassword - Current password
   * @param newPassword - New password to set
   * @returns Success message
   * @throws UnauthorizedException for incorrect old password
   * @throws ConflictException for password reuse
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      await this.auditLogService.log('password_change_failed', {
        userId: user.id,
        reason: 'incorrect_old_password',
      });
      throw new UnauthorizedException('Old password is incorrect');
    }

    // Check if password exists in history
    const passwordInHistory = await this.isPasswordInHistory(
      userId,
      newPassword,
    );
    if (passwordInHistory) {
      await this.auditLogService.log('password_change_failed', {
        userId: user.id,
        reason: 'password_reuse',
      });
      throw new ConflictException('Cannot reuse a previous password');
    }

    // Hash new password and update
    await this.usersService.update(userId, { password: newPassword });

    // Add the new password to history
    await this.passwordHistoryService.addToHistory(userId, newPassword);

    await this.auditLogService.log('password_changed', { userId });

    return { message: 'Password changed successfully' };
  }

  /**
   * Validates MFA code (supports TOTP and SMS)
   * @param user - User object with MFA configuration
   * @param code - MFA code to validate
   * @returns True if code is valid
   */
  validateMfaCode(user: User, code: string): boolean {
    if (!hasValidMfaConfig(user)) return false;

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

  /**
   * Sets MFA secret for a user
   * @param userId - User ID
   * @param secret - MFA secret to set
   */
  async setMfaSecret(userId: string, secret: string): Promise<void> {
    this.logger.log(`Setting MFA secret for user ${userId}...`);
    const result = await this.usersService.update(userId, {
      mfaSecret: secret,
      mfaEnabled: false,
      mfaType: 'totp',
    });
    this.logger.log(`MFA secret set for user ${userId}. Update result: ${JSON.stringify(result)}`);
  }

  /**
   * Retrieves user by ID
   * @param userId - User ID to look up
   * @returns User object
   * @throws BadRequestException if user not found
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found');
    return user;
  }

  /**
   * Enables MFA for a user
   * @param userId - User ID
   */
  async enableMfa(userId: string): Promise<void> {
    await this.usersService.update(userId, { mfaEnabled: true });
  }
}
