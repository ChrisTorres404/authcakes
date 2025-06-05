/** Request information for audit logging */
interface RequestInfo {
  ip?: string;
  userAgent?: string;
}

/** Represents a change in a user's profile field */
interface ProfileChange {
  before: string | null;
  after: string | null;
}

/** Type for updatable profile fields */
type ProfileFields = Pick<
  User,
  | 'firstName'
  | 'lastName'
  | 'avatar'
  | 'company'
  | 'department'
  | 'country'
  | 'state'
  | 'address'
  | 'address2'
  | 'city'
  | 'zipCode'
  | 'bio'
>;

// src/modules/users/services/users.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOneOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { MfaRecoveryCode } from '../../auth/entities/mfa-recovery-code.entity';
import { SessionService } from '../../auth/services/session.service';
import { AuditLogService } from '../../auth/services/audit-log.service';
import { SettingsService } from '../../settings/services/settings.service';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MfaRecoveryCode)
    private readonly mfaRecoveryCodeRepository: Repository<MfaRecoveryCode>,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly auditLogService: AuditLogService,
    private readonly settingsService: SettingsService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   * Find a user by their ID with optional relations and select options
   * @param id The user's unique identifier
   * @param options TypeORM find options for including relations or selecting specific fields
   * @returns The found user or throws NotFoundException
   */
  async findById(id: string, options?: FindOneOptions<User>): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      ...options,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * Find a user by password reset token
   * @param token The password reset token
   * @returns The user or null if not found
   */
  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { resetToken: token },
    });
  }

  /**
   * Find a user by account recovery token
   * @param token The account recovery token
   * @returns The user or null if not found
   */
  async findByRecoveryToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { accountRecoveryToken: token },
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    // Check if email already exists
    if (userData.email) {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Hash password if provided
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }

    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.findById(id);

    // Check if email is being changed and already exists
    if (userData.email && userData.email !== user.email) {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Hash password if provided
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }

    // Update user
    Object.assign(user, userData);
    return this.userRepository.save(user);
  }

  /**
   * Updates a user's profile based on system settings for allowed fields
   * @param id User ID
   * @param profileData Profile update data
   * @param updatedBy ID of the user making the update (for audit)
   * @param requestInfo Additional request info for audit logs
   * @returns Updated user
   */
  async updateProfile(
    id: string,
    profileData: UpdateUserProfileDto,
    updatedBy: string,
    requestInfo?: RequestInfo,
  ): Promise<User> {
    // Get user
    const user = await this.findById(id);

    // Get allowed fields from settings
    const allowProfileUpdate = await this.settingsService.getValue<boolean>(
      'ALLOW_USER_PROFILE_UPDATE',
      true,
    );

    if (!allowProfileUpdate) {
      throw new ForbiddenException('Profile updates are not allowed');
    }

    const allowedFields = await this.settingsService.getValue<
      Array<keyof UpdateUserProfileDto>
    >('PROFILE_UPDATABLE_FIELDS', [
      'firstName',
      'lastName',
      'avatar',
      'company',
      'department',
      'country',
      'state',
      'address',
      'address2',
      'city',
      'zipCode',
      'bio',
    ]);

    // Initialize changes record with all required properties
    const changes: Record<keyof UpdateUserProfileDto, ProfileChange> = {
      firstName: { before: null, after: null },
      lastName: { before: null, after: null },
      avatar: { before: null, after: null },
      company: { before: null, after: null },
      department: { before: null, after: null },
      country: { before: null, after: null },
      state: { before: null, after: null },
      address: { before: null, after: null },
      address2: { before: null, after: null },
      city: { before: null, after: null },
      zipCode: { before: null, after: null },
      bio: { before: null, after: null },
    };

    // Filter input to only include allowed fields
    const filteredData: Partial<User> = {};

    // Type-safe iteration over profile data
    (Object.keys(profileData) as Array<keyof UpdateUserProfileDto>).forEach(
      (key) => {
        if (allowedFields.includes(key) && profileData[key] !== undefined) {
          const value = profileData[key];
          const userKey = key as keyof ProfileFields;

          // Record change for audit log
          changes[key] = {
            before: user[userKey] as string | null,
            after: value as string | null,
          };

          // Only update if the key exists in User entity and value is string or null
          if (
            userKey in user &&
            (typeof value === 'string' || value === null)
          ) {
            // Safe assignment as we've verified the key exists in User
            filteredData[userKey] = value;
          }
        }
      },
    );

    // If no valid fields to update, return user without changes
    if (Object.keys(filteredData).length === 0) {
      return user;
    }

    // Update user with filtered data
    Object.assign(user, filteredData);
    const updatedUser = await this.userRepository.save(user);

    // Log the profile update
    await this.auditLogService.logProfileUpdate(
      id,
      updatedBy,
      changes,
      requestInfo?.ip,
      requestInfo?.userAgent,
    );

    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  async validatePassword(userId: string, password: string): Promise<boolean> {
    const user = await this.findById(userId);
    return bcrypt.compare(password, user.password);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.findById(userId);

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Update password
    user.password = await this.hashPassword(newPassword);
    await this.userRepository.save(user);

    return true;
  }

  async recordFailedLoginAttempt(userIdOrEmail: string): Promise<void> {
    // Find user by ID or email
    const query = userIdOrEmail.includes('@')
      ? { email: userIdOrEmail }
      : { id: userIdOrEmail };

    const user = await this.userRepository.findOne({ where: query });

    if (!user) {
      return; // Don't expose user existence
    }

    // Increment failed login attempts
    user.failedLoginAttempts += 1;

    // Lock account if too many attempts
    const maxAttempts = this.configService.get<number>(
      'auth.security.maxFailedAttempts',
      5,
    );
    if (user.failedLoginAttempts >= maxAttempts) {
      const lockDuration = this.configService.get<number>(
        'auth.security.lockDurationMinutes',
        30,
      );
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + lockDuration);
      user.lockedUntil = lockedUntil;

      this.logger.warn(
        `Account locked for user ${user.email} due to too many failed login attempts`,
      );
    }

    await this.userRepository.save(user);
  }

  async resetFailedLoginAttempts(id: string): Promise<void> {
    await this.userRepository.update(id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLogin: new Date(),
    });
  }

  async generateEmailVerificationToken(id: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');

    await this.userRepository.update(id, {
      emailVerificationToken: token,
    });

    return token;
  }

  async verifyEmail(token: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;

    return this.userRepository.save(user);
  }

  async generatePasswordResetToken(id: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiryHours = 24;
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + expiryHours);
    // Generate 6-digit OTP and expiry (10 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    // Security: Removed console.log that exposed password reset token details
    await this.userRepository.update(id, {
      resetToken: token,
      resetTokenExpiry,
      otp,
      otpExpiry,
    });
    return token;
  }

  async generateAccountRecoveryToken(id: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiryHours = 1; // 1 hour expiry for account recovery tokens
    const accountRecoveryTokenExpiry = new Date();
    accountRecoveryTokenExpiry.setHours(
      accountRecoveryTokenExpiry.getHours() + expiryHours,
    );

    // Security: Removed console.log that exposed account recovery token details

    await this.userRepository.update(id, {
      accountRecoveryToken: token,
      accountRecoveryTokenExpiry,
    });

    return token;
  }

  validateOtp(user: User, otp: string): boolean {
    if (!user.otp || !user.otpExpiry) return false;
    if (user.otp !== otp) return false;
    if (user.otpExpiry < new Date()) return false;
    return true;
  }

  async resetPassword(
    token: string,
    newPassword: string,
    otp?: string,
  ): Promise<User> {
    await this.auditLogService.log('password_reset_attempt', { token });
    // Security: Removed console.log that exposed password reset token
    const user = await this.userRepository.findOne({
      where: { resetToken: token },
    });
    // Security: Removed console.log that exposed user data
    if (!user) {
      // Security: Removed console.warn that exposed reset token
      await this.auditLogService.log('password_reset_failure', { token });
      throw new BadRequestException('Invalid reset token');
    }
    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      // Security: Removed console.warn that exposed token expiry information
      await this.auditLogService.log('password_reset_failure', {
        userId: user.id,
        reason: 'expired',
      });
      throw new BadRequestException('Reset token has expired');
    }
    // If OTP is required, validate it
    if (user.otp && user.otpExpiry) {
      if (!otp || !this.validateOtp(user, otp)) {
        await this.auditLogService.log('password_reset_failure', {
          userId: user.id,
          reason: 'invalid_otp',
        });
        throw new BadRequestException('Invalid or expired OTP');
      }
    }
    if (!user.active) {
      await this.auditLogService.log('password_reset_failure', {
        userId: user.id,
        reason: 'inactive',
      });
      throw new BadRequestException('Account is deactivated');
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.auditLogService.log('password_reset_failure', {
        userId: user.id,
        reason: 'locked',
      });
      throw new BadRequestException('Account is locked');
    }
    // Hash new password
    user.password = await this.hashPassword(newPassword);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.otp = null;
    user.otpExpiry = null;
    await this.auditLogService.log('password_reset_success', {
      userId: user.id,
    });
    return this.userRepository.save(user);
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>(
      'auth.password.bcryptRounds',
      10,
    );
    return bcrypt.hash(password, saltRounds);
  }

  async search(query: string): Promise<User[]> {
    return this.userRepository.find({
      where: [
        { email: Like(`%${query}%`) },
        { firstName: Like(`%${query}%`) },
        { lastName: Like(`%${query}%`) },
      ],
    });
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async verifyPhone(token: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { phoneVerificationToken: token },
    });
    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }
    user.phoneVerified = true;
    user.phoneVerificationToken = '';
    return this.userRepository.save(user);
  }

  async listActiveSessions(userId: string): Promise<unknown> {
    // Only return sessions for the user
    return this.sessionService.getActiveSessions(userId);
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    // Ensure the session belongs to the user before revoking
    const session = await this.sessionService.getSessionById(sessionId);
    if (!session || session.user.id !== userId) {
      throw new NotFoundException('Session not found or not owned by user');
    }
    await this.sessionService.revokeSession({ sessionId, revokedBy: userId });
  }

  async completeAccountRecovery(
    token: string,
    newPassword: string,
  ): Promise<User> {
    await this.auditLogService.log('account_recovery_attempt', { token });
    // Security: Removed console.log that exposed account recovery token

    const user = await this.userRepository.findOne({
      where: { accountRecoveryToken: token },
    });

    if (!user) {
      // Security: Removed console.warn that exposed invalid recovery token
      await this.auditLogService.log('account_recovery_failure', {
        token,
        reason: 'invalid_token',
      });
      throw new BadRequestException('Invalid recovery token');
    }

    if (
      user.accountRecoveryTokenExpiry &&
      user.accountRecoveryTokenExpiry < new Date()
    ) {
      // Security: Removed console.warn that exposed token expiry information
      await this.auditLogService.log('account_recovery_failure', {
        userId: user.id,
        reason: 'expired',
      });
      throw new BadRequestException('Recovery token has expired');
    }

    if (!user.active) {
      await this.auditLogService.log('account_recovery_failure', {
        userId: user.id,
        reason: 'inactive',
      });
      throw new BadRequestException('Account is deactivated');
    }

    // Use database transaction for account recovery completion
    const queryRunner = this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Hash new password
      user.password = await this.hashPassword(newPassword);
      user.accountRecoveryToken = null;
      user.accountRecoveryTokenExpiry = null;
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;

      const updatedUser = await queryRunner.manager.save(user);

      await this.auditLogService.log('account_recovery_success', {
        userId: user.id,
      });

      await queryRunner.commitTransaction();
      return updatedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Saves MFA recovery codes for a user
   * @param userId - User ID
   * @param codes - Array of recovery codes to save
   */
  async saveRecoveryCodes(userId: string, codes: string[]): Promise<void> {
    // Delete existing recovery codes
    await this.mfaRecoveryCodeRepository.delete({ userId });

    // Create new recovery codes using raw query to ensure userId is properly set
    if (codes.length > 0) {
      const queryRunner = this.mfaRecoveryCodeRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        for (const code of codes) {
          await queryRunner.query(
            `INSERT INTO "mfa_recovery_codes" ("userId", "code", "used") VALUES ($1, $2, $3)`,
            [userId, code, false]
          );
        }
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }
  }

  /**
   * Marks a recovery code as used
   * @param codeId - Recovery code ID
   */
  async markRecoveryCodeAsUsed(codeId: string): Promise<void> {
    await this.mfaRecoveryCodeRepository.update(
      { id: codeId },
      { 
        used: true,
        usedAt: new Date()
      }
    );
  }
}
