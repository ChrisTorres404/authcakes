import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as crypto from 'crypto';

import { TokenService } from '../../../src/modules/auth/services/token.service';
import { RefreshToken } from '../../../src/modules/auth/entities/refresh-token.entity';
import { RefreshTokenRepository } from '../../../src/modules/auth/repositories/refresh-token.repository';
import { SessionService } from '../../../src/modules/auth/services/session.service';

import { UserFactory } from '../../factories/user.factory';
import { SessionFactory } from '../../factories/session.factory';
import { RefreshTokenFactory } from '../../factories/refresh-token.factory';
import { mockRepository, mockSessionService } from '../../mocks/mock-services';
import { createMockConfigService, createMockJwtService } from '../../utils/test-helpers';

// Mock crypto module
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(),
  createHash: jest.fn(),
}));

describe('TokenService - Comprehensive Tests', () => {
  let tokenService: TokenService;
  let refreshTokenRepository: jest.Mocked<Repository<RefreshToken>>;
  let sessionService: jest.Mocked<ReturnType<typeof mockSessionService>>;
  let jwtService: jest.Mocked<ReturnType<typeof createMockJwtService>>;
  let configService: ReturnType<typeof createMockConfigService>;

  const mockRefreshTokenRepository = {
    ...mockRepository<RefreshToken>(),
    findByTokenHash: jest.fn(),
    revokeBySessionId: jest.fn(),
    revokeByUserId: jest.fn(),
    revokeTokenFamily: jest.fn(),
    cleanupExpired: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        RefreshTokenRepository,
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
        { provide: SessionService, useValue: mockSessionService() },
        { provide: JwtService, useValue: createMockJwtService() },
        {
          provide: ConfigService,
          useValue: createMockConfigService({
            auth: {
              jwtSecret: 'test-secret',
              jwtExpiresIn: '15m',
              refreshSecret: 'refresh-secret',
              refreshExpiresIn: '7d',
            },
          }),
        },
      ],
    }).compile();

    tokenService = module.get<TokenService>(TokenService);
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken));
    sessionService = module.get(SessionService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // Setup crypto mocks
    (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from('mock-random-bytes'));
    (crypto.createHash as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('mock-hash'),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const user = UserFactory.createVerified();
      const sessionId = 'session-123';
      const deviceInfo = {
        browser: 'Chrome',
        os: 'Windows',
        device: 'Desktop',
      };

      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      jwtService.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      refreshTokenRepository.create.mockReturnValue({
        tokenHash: 'mock-hash',
        userId: user.id,
        sessionId,
        deviceInfo,
      } as any);

      refreshTokenRepository.save.mockResolvedValue({
        id: 'refresh-token-id',
      } as any);

      const result = await tokenService.generateTokens(user, sessionId, deviceInfo);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          sessionId,
          type: 'access',
        },
        expect.objectContaining({
          expiresIn: '15m',
        }),
      );

      expect(refreshTokenRepository.save).toHaveBeenCalled();
    });

    it('should use family ID for token rotation', async () => {
      const user = UserFactory.createVerified();
      const sessionId = 'session-123';
      const familyId = 'family-123';

      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      jwtService.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      refreshTokenRepository.save.mockResolvedValue({
        id: 'refresh-token-id',
      } as any);

      const result = await tokenService.generateTokens(
        user,
        sessionId,
        undefined,
        familyId,
      );

      expect(result).toBeDefined();
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          family: familyId,
        }),
      );
    });
  });

  describe('generateAccessToken', () => {
    it('should generate an access token with correct payload', () => {
      const user = UserFactory.createVerified();
      const sessionId = 'session-123';
      const mockToken = 'mock-access-token';

      jwtService.sign.mockReturnValue(mockToken);

      const result = tokenService.generateAccessToken(user, sessionId);

      expect(result).toBe(mockToken);
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          sessionId,
          type: 'access',
        },
        {
          secret: 'test-secret',
          expiresIn: '15m',
        },
      );
    });

    it('should include tenant memberships if present', () => {
      const user = UserFactory.createVerified();
      user.tenantMemberships = [
        {
          tenantId: 'tenant-1',
          role: 'admin',
          isActive: true,
        } as any,
      ];
      const sessionId = 'session-123';

      tokenService.generateAccessToken(user, sessionId);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          tenants: [
            {
              tenantId: 'tenant-1',
              role: 'admin',
            },
          ],
        }),
        expect.any(Object),
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and return valid token payload', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
        sessionId: 'session-123',
        type: 'access',
      };

      jwtService.verify.mockReturnValue(mockPayload);

      const result = await tokenService.verifyAccessToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret',
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        tokenService.verifyAccessToken('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong token type', async () => {
      const mockPayload = {
        sub: 'user-123',
        type: 'refresh', // Wrong type
      };

      jwtService.verify.mockReturnValue(mockPayload);

      await expect(
        tokenService.verifyAccessToken('token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token and return token record', async () => {
      const user = UserFactory.createVerified();
      const session = SessionFactory.create(user);
      const refreshToken = RefreshTokenFactory.create(user, session);
      const tokenValue = 'valid-refresh-token';

      const mockPayload = {
        sub: user.id,
        jti: refreshToken.id,
        sessionId: session.id,
        type: 'refresh',
      };

      jwtService.verify.mockReturnValue(mockPayload);
      mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(refreshToken);

      const result = await tokenService.verifyRefreshToken(tokenValue);

      expect(result).toEqual(refreshToken);
      expect(jwtService.verify).toHaveBeenCalledWith(tokenValue, {
        secret: 'refresh-secret',
      });
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      const user = UserFactory.createVerified();
      const session = SessionFactory.create(user);
      const revokedToken = RefreshTokenFactory.createRevoked(
        user,
        session,
        'Token rotation',
      );

      const mockPayload = {
        sub: user.id,
        jti: revokedToken.id,
        sessionId: session.id,
        type: 'refresh',
      };

      jwtService.verify.mockReturnValue(mockPayload);
      mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(revokedToken);

      await expect(
        tokenService.verifyRefreshToken('token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const user = UserFactory.createVerified();
      const session = SessionFactory.create(user);
      const expiredToken = RefreshTokenFactory.createExpired(user, session);

      const mockPayload = {
        sub: user.id,
        jti: expiredToken.id,
        sessionId: session.id,
        type: 'refresh',
      };

      jwtService.verify.mockReturnValue(mockPayload);
      mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(expiredToken);

      await expect(
        tokenService.verifyRefreshToken('token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent token', async () => {
      const mockPayload = {
        sub: 'user-123',
        jti: 'token-123',
        sessionId: 'session-123',
        type: 'refresh',
      };

      jwtService.verify.mockReturnValue(mockPayload);
      mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(null);

      await expect(
        tokenService.verifyRefreshToken('token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke token and its family for suspicious activity', async () => {
      const user = UserFactory.createVerified();
      const session = SessionFactory.create(user);
      const refreshToken = RefreshTokenFactory.create(user, session, {
        family: 'family-123',
      });

      mockRefreshTokenRepository.findOne.mockResolvedValue(refreshToken);
      mockRefreshTokenRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRefreshTokenRepository.revokeTokenFamily.mockResolvedValue({ affected: 3 } as any);

      await tokenService.revokeRefreshToken(
        'token-hash',
        user.id,
        'Suspicious activity',
      );

      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
        { tokenHash: 'token-hash', userId: user.id },
        expect.objectContaining({
          isRevoked: true,
          revokedReason: 'Suspicious activity',
        }),
      );

      expect(mockRefreshTokenRepository.revokeTokenFamily).toHaveBeenCalledWith(
        'family-123',
        'Suspicious activity - family revoked',
      );
    });

    it('should only revoke single token for normal reasons', async () => {
      const user = UserFactory.createVerified();
      const session = SessionFactory.create(user);
      const refreshToken = RefreshTokenFactory.create(user, session);

      mockRefreshTokenRepository.findOne.mockResolvedValue(refreshToken);
      mockRefreshTokenRepository.update.mockResolvedValue({ affected: 1 } as any);

      await tokenService.revokeRefreshToken(
        'token-hash',
        user.id,
        'User logout',
      );

      expect(mockRefreshTokenRepository.update).toHaveBeenCalled();
      expect(mockRefreshTokenRepository.revokeTokenFamily).not.toHaveBeenCalled();
    });
  });

  describe('revokeSession', () => {
    it('should revoke all tokens for a session', async () => {
      const sessionId = 'session-123';
      const userId = 'user-123';

      mockRefreshTokenRepository.revokeBySessionId.mockResolvedValue({ affected: 5 } as any);
      sessionService.revoke.mockResolvedValue(undefined);

      await tokenService.revokeSession(sessionId, userId, 'Session expired');

      expect(mockRefreshTokenRepository.revokeBySessionId).toHaveBeenCalledWith(
        sessionId,
        'Session expired',
      );
      expect(sessionService.revoke).toHaveBeenCalledWith(sessionId, userId);
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all user tokens and sessions', async () => {
      const userId = 'user-123';

      mockRefreshTokenRepository.revokeByUserId.mockResolvedValue({ affected: 10 } as any);
      sessionService.revokeAllUserSessions.mockResolvedValue(undefined);

      await tokenService.revokeAllUserTokens(userId, 'Password changed');

      expect(mockRefreshTokenRepository.revokeByUserId).toHaveBeenCalledWith(
        userId,
        'Password changed',
      );
      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(
        userId,
        'Password changed',
      );
    });
  });

  describe('saveRefreshToken', () => {
    it('should save refresh token with correct hash', async () => {
      const tokenData = {
        tokenValue: 'refresh-token-value',
        userId: 'user-123',
        sessionId: 'session-123',
        family: 'family-123',
        deviceInfo: {
          browser: 'Chrome',
          os: 'Windows',
          device: 'Desktop',
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      refreshTokenRepository.save.mockResolvedValue({
        id: 'saved-token-id',
      } as any);

      await tokenService.saveRefreshToken(tokenData);

      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenHash: 'mock-hash',
          userId: tokenData.userId,
          sessionId: tokenData.sessionId,
          family: tokenData.family,
          deviceInfo: tokenData.deviceInfo,
          expiresAt: tokenData.expiresAt,
        }),
      );
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should cleanup expired tokens', async () => {
      mockRefreshTokenRepository.cleanupExpired.mockResolvedValue({ affected: 25 } as any);

      const result = await tokenService.cleanupExpiredTokens();

      expect(result).toBe(25);
      expect(mockRefreshTokenRepository.cleanupExpired).toHaveBeenCalled();
    });
  });

  describe('Token rotation scenarios', () => {
    it('should handle token rotation with family tracking', async () => {
      const user = UserFactory.createVerified();
      const session = SessionFactory.create(user);
      const oldToken = RefreshTokenFactory.create(user, session, {
        family: 'family-123',
      });

      // First, revoke old token
      mockRefreshTokenRepository.findOne.mockResolvedValue(oldToken);
      mockRefreshTokenRepository.update.mockResolvedValue({ affected: 1 } as any);

      await tokenService.revokeRefreshToken(
        'old-token-hash',
        user.id,
        'Token rotation',
      );

      // Then generate new token with same family
      const deviceInfo = {
        browser: 'Chrome',
        os: 'Windows',
        device: 'Desktop',
      };

      jwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      refreshTokenRepository.save.mockResolvedValue({
        id: 'new-token-id',
      } as any);

      const newTokens = await tokenService.generateTokens(
        user,
        session.id,
        deviceInfo,
        'family-123',
      );

      expect(newTokens).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      // Verify old token was revoked for rotation, not suspicious activity
      expect(mockRefreshTokenRepository.revokeTokenFamily).not.toHaveBeenCalled();
    });

    it('should detect and handle token reuse attack', async () => {
      const user = UserFactory.createVerified();
      const session = SessionFactory.create(user);
      const revokedToken = RefreshTokenFactory.createRevoked(
        user,
        session,
        'Token rotation',
        {
          family: 'family-123',
        },
      );

      // Attempt to use already revoked token (reuse attack)
      const mockPayload = {
        sub: user.id,
        jti: revokedToken.id,
        sessionId: session.id,
        type: 'refresh',
      };

      jwtService.verify.mockReturnValue(mockPayload);
      mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(revokedToken);

      await expect(
        tokenService.verifyRefreshToken('revoked-token'),
      ).rejects.toThrow(UnauthorizedException);

      // In a real implementation, this would trigger family revocation
      // through the auth flow
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle missing user data gracefully', () => {
      const userWithMinimalData = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      } as any;

      const token = tokenService.generateAccessToken(userWithMinimalData, 'session-123');

      expect(token).toBeDefined();
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-123',
          email: 'test@example.com',
          role: 'user',
        }),
        expect.any(Object),
      );
    });

    it('should handle database errors during token save', async () => {
      const user = UserFactory.createVerified();
      const sessionId = 'session-123';

      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      refreshTokenRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(
        tokenService.generateTokens(user, sessionId),
      ).rejects.toThrow('Database error');
    });

    it('should handle concurrent token cleanup', async () => {
      // Simulate multiple cleanup calls
      const cleanupPromises = Array(5).fill(null).map(() => 
        tokenService.cleanupExpiredTokens()
      );

      mockRefreshTokenRepository.cleanupExpired.mockResolvedValue({ affected: 10 } as any);

      const results = await Promise.all(cleanupPromises);

      expect(results).toEqual([10, 10, 10, 10, 10]);
      expect(mockRefreshTokenRepository.cleanupExpired).toHaveBeenCalledTimes(5);
    });
  });

  describe('Performance and optimization', () => {
    it('should batch token operations efficiently', async () => {
      const users = UserFactory.createMany(10);
      const sessions = users.map(user => SessionFactory.create(user));

      // Generate tokens for multiple users
      const tokenPromises = users.map((user, index) =>
        tokenService.generateTokens(user, sessions[index].id),
      );

      jwtService.sign.mockReturnValue('mock-token');
      refreshTokenRepository.save.mockResolvedValue({ id: 'token-id' } as any);

      const results = await Promise.all(tokenPromises);

      expect(results).toHaveLength(10);
      expect(jwtService.sign).toHaveBeenCalledTimes(20); // 2 per user
      expect(refreshTokenRepository.save).toHaveBeenCalledTimes(10);
    });
  });
});