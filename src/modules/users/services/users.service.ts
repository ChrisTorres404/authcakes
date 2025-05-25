// src/modules/users/services/users.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { SessionService } from '../../auth/services/session.service';
import { AuditLogService } from '../../auth/services/audit-log.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findById(id: string, options?: any): Promise<User> {
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

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  async validatePassword(userId: string, password: string): Promise<boolean> {
    const user = await this.findById(userId);
    return bcrypt.compare(password, user.password);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
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
    const maxAttempts = this.configService.get<number>('auth.security.maxFailedAttempts', 5);
    if (user.failedLoginAttempts >= maxAttempts) {
      const lockDuration = this.configService.get<number>('auth.security.lockDurationMinutes', 30);
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + lockDuration);
      user.lockedUntil = lockedUntil;
      
      this.logger.warn(`Account locked for user ${user.email} due to too many failed login attempts`);
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
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    console.log('[UsersService] Generated password reset token:', token, 'for user:', id, 'expires at:', resetTokenExpiry);
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
    accountRecoveryTokenExpiry.setHours(accountRecoveryTokenExpiry.getHours() + expiryHours);
    
    console.log('[UsersService] Generated account recovery token:', token, 'for user:', id, 'expires at:', accountRecoveryTokenExpiry);
    
    await this.userRepository.update(id, {
      accountRecoveryToken: token,
      accountRecoveryTokenExpiry,
    });
    
    return token;
  }

  async validateOtp(user: User, otp: string): Promise<boolean> {
    if (!user.otp || !user.otpExpiry) return false;
    if (user.otp !== otp) return false;
    if (user.otpExpiry < new Date()) return false;
    return true;
  }

  async resetPassword(token: string, newPassword: string, otp?: string): Promise<User> {
    this.auditLogService.log('password_reset_attempt', { token });
    console.log('[UsersService] Attempting password reset with token:', token);
    const user = await this.userRepository.findOne({
      where: { resetToken: token },
    });
    console.log('[UsersService] User lookup result for reset token:', user);
    if (!user) {
      console.warn('[UsersService] Invalid reset token:', token);
      this.auditLogService.log('password_reset_failure', { token });
      throw new BadRequestException('Invalid reset token');
    }
    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      console.warn('[UsersService] Reset token expired:', user.resetTokenExpiry, 'now:', new Date());
      this.auditLogService.log('password_reset_failure', { userId: user.id, reason: 'expired' });
      throw new BadRequestException('Reset token has expired');
    }
    // If OTP is required, validate it
    if (user.otp && user.otpExpiry) {
      if (!otp || !(await this.validateOtp(user, otp))) {
        this.auditLogService.log('password_reset_failure', { userId: user.id, reason: 'invalid_otp' });
        throw new BadRequestException('Invalid or expired OTP');
      }
    }
    if (!user.active) {
      this.auditLogService.log('password_reset_failure', { userId: user.id, reason: 'inactive' });
      throw new BadRequestException('Account is deactivated');
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      this.auditLogService.log('password_reset_failure', { userId: user.id, reason: 'locked' });
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
    this.auditLogService.log('password_reset_success', { userId: user.id });
    return this.userRepository.save(user);
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('auth.password.bcryptRounds', 10);
    return bcrypt.hash(password, saltRounds);
  }

  async search(query: string): Promise<User[]> {
    return this.userRepository.find({
      where: [
        { email: Like(`%${query}%`) },
        { firstName: Like(`%${query}%`) },
        { lastName: Like(`%${query}%`) }
      ]
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
      where: { phoneVerificationToken: token }
    });
    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }
    user.phoneVerified = true;
    user.phoneVerificationToken = '';
    return this.userRepository.save(user);
  }

  async listActiveSessions(userId: string) {
    // Only return sessions for the user
    return this.sessionService.getActiveSessions(userId);
  }

  async revokeSession(userId: string, sessionId: string) {
    // Ensure the session belongs to the user before revoking
    const session = await this.sessionService.getSessionById(sessionId);
    if (!session || session.user.id !== userId) {
      throw new NotFoundException('Session not found or not owned by user');
    }
    await this.sessionService.revokeSession({ sessionId, revokedBy: userId });
  }

  async completeAccountRecovery(token: string, newPassword: string): Promise<User> {
    this.auditLogService.log('account_recovery_attempt', { token });
    console.log('[UsersService] Attempting account recovery with token:', token);
    
    const user = await this.userRepository.findOne({
      where: { accountRecoveryToken: token },
    });
    
    if (!user) {
      console.warn('[UsersService] Invalid account recovery token:', token);
      this.auditLogService.log('account_recovery_failure', { token, reason: 'invalid_token' });
      throw new BadRequestException('Invalid recovery token');
    }
    
    if (user.accountRecoveryTokenExpiry && user.accountRecoveryTokenExpiry < new Date()) {
      console.warn('[UsersService] Account recovery token expired:', user.accountRecoveryTokenExpiry, 'now:', new Date());
      this.auditLogService.log('account_recovery_failure', { userId: user.id, reason: 'expired' });
      throw new BadRequestException('Recovery token has expired');
    }
    
    if (!user.active) {
      this.auditLogService.log('account_recovery_failure', { userId: user.id, reason: 'inactive' });
      throw new BadRequestException('Account is deactivated');
    }
    
    // Hash new password
    user.password = await this.hashPassword(newPassword);
    user.accountRecoveryToken = null;
    user.accountRecoveryTokenExpiry = null;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    
    this.auditLogService.log('account_recovery_success', { userId: user.id });
    
    return this.userRepository.save(user);
  }
}