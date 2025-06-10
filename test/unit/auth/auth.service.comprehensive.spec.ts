import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';

import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { UsersService } from '../../../src/modules/users/services/users.service';
import { TokenService } from '../../../src/modules/auth/services/token.service';
import { SessionService } from '../../../src/modules/auth/services/session.service';
import { NotificationService } from '../../../src/modules/auth/services/notification.service';
import { AuditLogService } from '../../../src/modules/auth/services/audit-log.service';
import { PasswordHistoryService } from '../../../src/modules/auth/services/password-history.service';

import { UserFactory } from '../../factories/user.factory';
import { SessionFactory } from '../../factories/session.factory';
import {
  mockUsersService,
  mockTokenService,
  mockSessionService,
  mockNotificationService,
  mockAuditLogService,
  mockPasswordHistoryService,
  mockRepository,
} from '../../mocks/mock-services';
import { createMockConfigService, createMockJwtService } from '../../utils/test-helpers';

describe('AuthService - Comprehensive Tests', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<ReturnType<typeof mockUsersService>>;
  let tokenService: jest.Mocked<ReturnType<typeof mockTokenService>>;
  let sessionService: jest.Mocked<ReturnType<typeof mockSessionService>>;
  let notificationService: jest.Mocked<ReturnType<typeof mockNotificationService>>;
  let auditLogService: jest.Mocked<ReturnType<typeof mockAuditLogService>>;
  let passwordHistoryService: jest.Mocked<ReturnType<typeof mockPasswordHistoryService>>;
  let jwtService: jest.Mocked<ReturnType<typeof createMockJwtService>>;
  let configService: ReturnType<typeof createMockConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService() },
        { provide: TokenService, useValue: mockTokenService() },
        { provide: SessionService, useValue: mockSessionService() },
        { provide: NotificationService, useValue: mockNotificationService() },
        { provide: AuditLogService, useValue: mockAuditLogService() },
        { provide: PasswordHistoryService, useValue: mockPasswordHistoryService() },
        { provide: JwtService, useValue: createMockJwtService() },
        {
          provide: ConfigService,
          useValue: createMockConfigService({
            auth: {
              passwordMinLength: 8,
              passwordRequireUppercase: true,
              passwordRequireLowercase: true,
              passwordRequireNumbers: true,
              passwordRequireSpecialChars: true,
              maxLoginAttempts: 5,
              lockoutDuration: 30,
            },
          }),
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    tokenService = module.get(TokenService);
    sessionService = module.get(SessionService);
    notificationService = module.get(NotificationService);
    auditLogService = module.get(AuditLogService);
    passwordHistoryService = module.get(PasswordHistoryService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const password = 'Test123!@#';
      const user = UserFactory.createWithHashedPassword(password, {
        email: 'test@example.com',
        isActive: true,
      });

      usersService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await authService.validateUser('test@example.com', password);

      expect(result).toEqual(user);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.validateUser('nonexistent@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      const user = UserFactory.create();
      usersService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(
        authService.validateUser(user.email, 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const user = UserFactory.create({ isActive: false });
      usersService.findByEmail.mockResolvedValue(user);

      await expect(
        authService.validateUser(user.email, 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    const deviceInfo = {
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      browser: 'Chrome',
      os: 'Windows',
      device: 'Desktop',
    };

    it('should successfully login a user', async () => {
      const user = UserFactory.createVerified();
      const session = SessionFactory.create(user);
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      sessionService.create.mockResolvedValue(session);
      tokenService.generateTokens.mockResolvedValue(tokens);
      usersService.updateLastLogin.mockResolvedValue(user);

      const result = await authService.login(user, deviceInfo);

      expect(result).toEqual({
        user: expect.objectContaining({
          id: user.id,
          email: user.email,
        }),
        sessionId: session.id,
        ...tokens,
      });
      expect(sessionService.create).toHaveBeenCalledWith(user.id, deviceInfo);
      expect(tokenService.generateTokens).toHaveBeenCalledWith(user, session.id);
      expect(auditLogService.logUserLogin).toHaveBeenCalled();
    });

    it('should handle login with unverified email when allowed', async () => {
      const user = UserFactory.create({ emailVerified: false });
      const session = SessionFactory.create(user);
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      sessionService.create.mockResolvedValue(session);
      tokenService.generateTokens.mockResolvedValue(tokens);

      const result = await authService.login(user, deviceInfo);

      expect(result).toBeDefined();
      expect(notificationService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should enforce MFA when enabled', async () => {
      const user = UserFactory.createWithMfa();
      
      await expect(
        authService.login(user, deviceInfo),
      ).rejects.toThrow('MFA verification required');
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'Test123!@#',
      firstName: 'New',
      lastName: 'User',
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashed-password';
      const user = UserFactory.create({
        ...registerDto,
        password: hashedPassword,
      });
      const session = SessionFactory.create(user);
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      const verificationToken = 'verification-token';

      usersService.findByEmail.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve(hashedPassword));
      usersService.create.mockResolvedValue(user);
      sessionService.create.mockResolvedValue(session);
      tokenService.generateTokens.mockResolvedValue(tokens);
      jwtService.sign.mockReturnValue(verificationToken);

      const result = await authService.register(registerDto, deviceInfo);

      expect(result).toEqual({
        user: expect.objectContaining({
          id: user.id,
          email: user.email,
        }),
        sessionId: session.id,
        ...tokens,
        verificationToken,
      });
      expect(passwordHistoryService.addPassword).toHaveBeenCalledWith(user.id, hashedPassword);
      expect(notificationService.sendWelcomeEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingUser = UserFactory.create();
      usersService.findByEmail.mockResolvedValue(existingUser);

      await expect(
        authService.register(registerDto, deviceInfo),
      ).rejects.toThrow(ConflictException);
    });

    it('should validate password complexity', async () => {
      const weakPasswordDto = {
        ...registerDto,
        password: 'weak',
      };

      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.register(weakPasswordDto, deviceInfo),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refresh', () => {
    it('should successfully refresh tokens', async () => {
      const user = UserFactory.createVerified();
      const session = SessionFactory.create(user);
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      usersService.findById.mockResolvedValue(user);
      sessionService.findById.mockResolvedValue(session);
      tokenService.generateTokens.mockResolvedValue(newTokens);

      const result = await authService.refresh(user.id, session.id, deviceInfo);

      expect(result).toEqual({
        user: expect.objectContaining({
          id: user.id,
          email: user.email,
        }),
        ...newTokens,
      });
      expect(sessionService.update).toHaveBeenCalledWith(session.id, {
        lastActivityAt: expect.any(Date),
      });
    });

    it('should throw UnauthorizedException for invalid session', async () => {
      const user = UserFactory.create();
      usersService.findById.mockResolvedValue(user);
      sessionService.findById.mockResolvedValue(null);

      await expect(
        authService.refresh(user.id, 'invalid-session', deviceInfo),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired session', async () => {
      const user = UserFactory.create();
      const expiredSession = SessionFactory.createExpired(user);
      
      usersService.findById.mockResolvedValue(user);
      sessionService.findById.mockResolvedValue(expiredSession);

      await expect(
        authService.refresh(user.id, expiredSession.id, deviceInfo),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      const user = UserFactory.createVerified();
      const oldPassword = 'OldPass123!';
      const newPassword = 'NewPass123!';
      const hashedNewPassword = 'hashed-new-password';

      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve(hashedNewPassword));
      passwordHistoryService.isPasswordReused.mockResolvedValue(false);
      usersService.updatePassword.mockResolvedValue({
        ...user,
        password: hashedNewPassword,
      });

      const result = await authService.changePassword(user.id, oldPassword, newPassword);

      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(
        user.id,
        'Password changed',
      );
      expect(passwordHistoryService.addPassword).toHaveBeenCalledWith(
        user.id,
        hashedNewPassword,
      );
      expect(auditLogService.logPasswordChange).toHaveBeenCalled();
      expect(notificationService.sendPasswordChangeNotification).toHaveBeenCalled();
    });

    it('should reject reused passwords', async () => {
      const user = UserFactory.create();
      
      usersService.findById.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      passwordHistoryService.isPasswordReused.mockResolvedValue(true);

      await expect(
        authService.changePassword(user.id, 'OldPass123!', 'NewPass123!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject weak passwords', async () => {
      const user = UserFactory.create();
      
      usersService.findById.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      await expect(
        authService.changePassword(user.id, 'OldPass123!', 'weak'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email for existing user', async () => {
      const user = UserFactory.createVerified();
      const resetToken = 'reset-token';

      usersService.findByEmail.mockResolvedValue(user);
      jwtService.sign.mockReturnValue(resetToken);

      const result = await authService.forgotPassword(user.email);

      expect(result).toEqual({ tokenSent: true });
      expect(notificationService.sendPasswordResetEmail).toHaveBeenCalledWith(
        user,
        resetToken,
      );
    });

    it('should not reveal if user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await authService.forgotPassword('nonexistent@example.com');

      expect(result).toEqual({ tokenSent: true });
      expect(notificationService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      const user = UserFactory.createVerified();
      const newPassword = 'NewPass123!';
      const hashedPassword = 'hashed-password';
      const payload = { sub: user.id, type: 'password-reset' };

      jwtService.verify.mockReturnValue(payload);
      usersService.findById.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve(hashedPassword));
      passwordHistoryService.isPasswordReused.mockResolvedValue(false);
      usersService.updatePassword.mockResolvedValue({
        ...user,
        password: hashedPassword,
      });

      const result = await authService.resetPassword('valid-token', newPassword);

      expect(result).toEqual({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
      expect(sessionService.revokeAllUserSessions).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'password_reset',
      }));
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        authService.resetPassword('invalid-token', 'NewPass123!'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email with valid token', async () => {
      const user = UserFactory.create({ emailVerified: false });
      const payload = { sub: user.id, type: 'email-verification' };

      jwtService.verify.mockReturnValue(payload);
      usersService.findById.mockResolvedValue(user);
      usersService.verifyEmail.mockResolvedValue({
        ...user,
        emailVerified: true,
      });

      const result = await authService.verifyEmail('valid-token');

      expect(result).toEqual({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: true,
      });
      expect(auditLogService.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'email_verified',
      }));
    });

    it('should handle already verified email', async () => {
      const user = UserFactory.createVerified();
      const payload = { sub: user.id, type: 'email-verification' };

      jwtService.verify.mockReturnValue(payload);
      usersService.findById.mockResolvedValue(user);

      const result = await authService.verifyEmail('valid-token');

      expect(result).toBeDefined();
      expect(usersService.verifyEmail).not.toHaveBeenCalled();
    });
  });

  describe('MFA methods', () => {
    describe('enrollMfa', () => {
      it('should generate MFA secret and QR code', async () => {
        const user = UserFactory.create({ mfaEnabled: false });
        const secret = { base32: 'ABCDEFGHIJKLMNOP' };
        const otpauth_url = 'otpauth://totp/...';

        jest.spyOn(speakeasy, 'generateSecret').mockReturnValue({
          ...secret,
          otpauth_url,
        } as any);

        const result = await authService.enrollMfa(user.id);

        expect(result).toEqual({
          secret: secret.base32,
          otpauth_url,
          setupStatus: 'pending',
        });
      });
    });

    describe('verifyAndEnableMfa', () => {
      it('should enable MFA with valid token', async () => {
        const user = UserFactory.create({
          mfaEnabled: false,
          otpSecret: 'ABCDEFGHIJKLMNOP',
        });

        usersService.findById.mockResolvedValue(user);
        jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);
        usersService.update.mockResolvedValue({
          ...user,
          mfaEnabled: true,
        });

        const result = await authService.verifyAndEnableMfa(user.id, '123456');

        expect(result).toEqual({
          message: 'MFA enabled successfully',
          recoveryCodes: expect.any(Array),
        });
        expect(result.recoveryCodes).toHaveLength(10);
        expect(auditLogService.logMfaEnabled).toHaveBeenCalled();
      });

      it('should reject invalid MFA token', async () => {
        const user = UserFactory.create({
          mfaEnabled: false,
          otpSecret: 'ABCDEFGHIJKLMNOP',
        });

        usersService.findById.mockResolvedValue(user);
        jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

        await expect(
          authService.verifyAndEnableMfa(user.id, '000000'),
        ).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('verifyMfaToken', () => {
      it('should verify valid MFA token', async () => {
        const user = UserFactory.createWithMfa();

        jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);

        const result = await authService.verifyMfaToken(user, '123456');

        expect(result).toBe(true);
      });

      it('should verify valid recovery code', async () => {
        const recoveryCodes = ['ABC123', 'DEF456'];
        const user = UserFactory.createWithMfa({
          otpBackupCodes: JSON.stringify(recoveryCodes),
        });

        jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);
        usersService.update.mockResolvedValue(user);

        const result = await authService.verifyMfaToken(user, 'ABC123');

        expect(result).toBe(true);
        expect(usersService.update).toHaveBeenCalledWith(
          user.id,
          expect.objectContaining({
            otpBackupCodes: JSON.stringify(['DEF456']),
          }),
        );
      });

      it('should reject invalid token and recovery code', async () => {
        const user = UserFactory.createWithMfa({
          otpBackupCodes: JSON.stringify(['ABC123']),
        });

        jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

        const result = await authService.verifyMfaToken(user, 'INVALID');

        expect(result).toBe(false);
      });
    });
  });

  describe('Account Recovery', () => {
    describe('requestAccountRecovery', () => {
      it('should initiate account recovery', async () => {
        const user = UserFactory.createVerified({
          accountRecoveryEmail: 'recovery@example.com',
          accountRecoveryEmailVerified: true,
        });

        usersService.findByEmail.mockResolvedValue(user);

        const result = await authService.requestAccountRecovery({
          email: user.email,
          recoveryMethod: 'email',
        });

        expect(result).toEqual({ message: 'Recovery code sent if account exists' });
        expect(notificationService.sendEmail).toHaveBeenCalled();
      });

      it('should not reveal if account does not exist', async () => {
        usersService.findByEmail.mockResolvedValue(null);

        const result = await authService.requestAccountRecovery({
          email: 'nonexistent@example.com',
          recoveryMethod: 'email',
        });

        expect(result).toEqual({ message: 'Recovery code sent if account exists' });
        expect(notificationService.sendEmail).not.toHaveBeenCalled();
      });
    });

    describe('completeAccountRecovery', () => {
      it('should complete recovery with valid code', async () => {
        const user = UserFactory.createVerified();
        const newPassword = 'NewPass123!';
        const hashedPassword = 'hashed-password';

        usersService.findByEmail.mockResolvedValue(user);
        jwtService.verify.mockReturnValue({
          sub: user.id,
          code: 'ABC123',
          type: 'account-recovery',
        });
        jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve(hashedPassword));
        passwordHistoryService.isPasswordReused.mockResolvedValue(false);
        usersService.updatePassword.mockResolvedValue({
          ...user,
          password: hashedPassword,
        });

        const result = await authService.completeAccountRecovery({
          email: user.email,
          code: 'ABC123',
          newPassword,
        });

        expect(result).toEqual({ message: 'Account recovery completed successfully' });
        expect(sessionService.revokeAllUserSessions).toHaveBeenCalled();
        expect(auditLogService.logAccountRecovery).toHaveBeenCalled();
      });
    });
  });

  describe('Helper methods', () => {
    describe('validatePasswordStrength', () => {
      it('should accept strong passwords', () => {
        const strongPasswords = [
          'Test123!@#',
          'P@ssw0rd!',
          'Str0ng&Secure',
        ];

        strongPasswords.forEach(password => {
          expect(() => authService['validatePasswordStrength'](password)).not.toThrow();
        });
      });

      it('should reject weak passwords', () => {
        const weakPasswords = [
          'short',           // Too short
          'alllowercase',    // No uppercase
          'ALLUPPERCASE',    // No lowercase
          'NoNumbers!',      // No numbers
          'N0Symb0ls',       // No special chars
        ];

        weakPasswords.forEach(password => {
          expect(() => authService['validatePasswordStrength'](password)).toThrow(BadRequestException);
        });
      });
    });

    describe('sanitizeUser', () => {
      it('should remove sensitive fields', () => {
        const user = UserFactory.create({
          password: 'should-be-removed',
          otpSecret: 'should-be-removed',
        });

        const sanitized = authService['sanitizeUser'](user);

        expect(sanitized.password).toBeUndefined();
        expect(sanitized.otpSecret).toBeUndefined();
        expect(sanitized.email).toBe(user.email);
      });
    });
  });
});