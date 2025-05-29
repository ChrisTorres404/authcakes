import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from '../../../src/modules/auth/services/token.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../../src/modules/users/services/users.service';
import { TenantsService } from '../../../src/modules/tenants/services/tenants.service';
import { SessionService } from '../../../src/modules/auth/services/session.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from '../../../src/modules/auth/entities/refresh-token.entity';
import { User } from '../../../src/modules/users/entities/user.entity';
import { FindOneOptions } from 'typeorm';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtPayload } from '../../../src/modules/auth/interfaces/jwt-payload.interface';
import { Session } from '../../../src/modules/auth/entities/session.entity';
import { TenantMembership } from '../../../src/modules/tenants/entities/tenant-membership.entity';

/**
 * Interface for mock repository functions with proper typing
 */
interface MockRepository<T> {
  findOne: jest.Mock<Promise<T | null>, [FindOneOptions<T>?]>;
  save: jest.Mock<Promise<T>, [Partial<T>]>;
  update: jest.Mock<Promise<{ affected?: number }>, [Partial<T>, Partial<T>]>;
}

/**
 * JWT payload interfaces for different token types
 */
interface AccessTokenPayload extends Omit<JwtPayload, 'type'> {
  type: 'access';
}

interface RefreshTokenPayload extends JwtPayload {
  type: 'refresh';
  email: string;
  role: string;
  tenantAccess: string[];
}

/**
 * Mock service interfaces with strongly typed methods
 */
interface MockJwtService {
  sign: jest.Mock<string, [Record<string, unknown>, Record<string, unknown>?]>;
  verify: jest.Mock<JwtPayload, [string]>;
}

interface MockUsersService {
  findOne: jest.Mock<Promise<Partial<User> | null>, [string]>;
}

interface MockTenantsService {
  getUserTenantMemberships: jest.Mock<Promise<TenantMembership[]>, [string]>;
}

interface MockSessionService {
  createSession: jest.Mock<Promise<void>, [string, string]>;
  revokeSession: jest.Mock<Promise<void>, [string]>;
  getActiveSessions: jest.Mock<Promise<Session[]>, [string]>;
}

type MockRefreshTokenRepo = MockRepository<RefreshToken>;

const mockJwtService: MockJwtService = {
  sign: jest.fn<string, [Record<string, unknown>, Record<string, unknown>?]>(),
  verify: jest.fn<JwtPayload, [string]>(),
};
const mockUsersService: MockUsersService = {
  findOne: jest.fn<Promise<Partial<User> | null>, [string]>(),
};
const mockTenantsService: MockTenantsService = {
  getUserTenantMemberships: jest.fn<Promise<TenantMembership[]>, [string]>(),
};
const mockSessionService: MockSessionService = {
  createSession: jest.fn<Promise<void>, [string, string]>(),
  revokeSession: jest.fn<Promise<void>, [string]>(),
  getActiveSessions: jest.fn<Promise<Session[]>, [string]>(),
};
const mockRefreshTokenRepository: MockRefreshTokenRepo = {
  save: jest.fn<Promise<RefreshToken>, [Partial<RefreshToken>]>(),
  findOne: jest.fn<
    Promise<RefreshToken | null>,
    [FindOneOptions<RefreshToken>?]
  >(),
  update: jest.fn<
    Promise<{ affected?: number }>,
    [Partial<RefreshToken>, Partial<RefreshToken>]
  >(),
};

/**
 * Test suite for TokenService
 * Verifies token generation, validation, and management functionality
 */
describe('TokenService', () => {
  let service: TokenService;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: TenantsService, useValue: mockTenantsService },
        { provide: SessionService, useValue: mockSessionService },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * Tests for access token generation
   * Verifies proper payload handling and token signing
   */
  describe('generateAccessToken', () => {
    it('should call jwtService.sign with payload', () => {
      const payload: AccessTokenPayload = {
        sub: '1',
        email: 'test@example.com',
        role: 'user',
        tenantId: null,
        tenantAccess: [],
        sessionId: 'sid',
        type: 'access',
      };
      mockJwtService.sign.mockReturnValue('signed-token');
      const token = service.generateAccessToken(payload);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        payload,
        expect.any(Object),
      );
      expect(token).toBe('signed-token');
    });
  });

  /**
   * Tests for refresh token generation
   * Verifies token creation, storage, and error handling
   */
  describe('generateRefreshToken', () => {
    it('should save refresh token and return it', async () => {
      mockJwtService.sign.mockReturnValue('refresh-token');
      mockRefreshTokenRepository.save.mockResolvedValue({
        id: '1',
        token: 'refresh-token',
        expiresAt: new Date(),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as RefreshToken);
      const payload: RefreshTokenPayload = {
        sub: '1',
        email: 'test@example.com',
        role: 'user',
        sessionId: 'sid',
        tenantId: null,
        tenantAccess: [],
        type: 'refresh',
      };
      const token = await service.generateRefreshToken(payload);
      expect(mockRefreshTokenRepository.save).toHaveBeenCalled();
      expect(token).toBe('refresh-token');
    });
    it('should throw if repository save fails', async () => {
      mockJwtService.sign.mockReturnValue('refresh-token');
      mockRefreshTokenRepository.save.mockRejectedValue(new Error('DB error'));
      const payload: RefreshTokenPayload = {
        sub: '1',
        email: 'test@example.com',
        role: 'user',
        sessionId: 'sid',
        tenantId: null,
        tenantAccess: [],
        type: 'refresh',
      };
      await expect(service.generateRefreshToken(payload)).rejects.toThrow(
        new Error('DB error'),
      );
    });
  });

  /**
   * Tests for refresh token revocation
   * Verifies proper token invalidation
   */
  describe('revokeRefreshToken', () => {
    it('should update the refresh token as revoked', async () => {
      mockRefreshTokenRepository.update.mockResolvedValue({ affected: 1 });
      await service.revokeRefreshToken('token');
      expect(mockRefreshTokenRepository.update).toHaveBeenCalled();
    });
  });

  /**
   * Tests for refresh token validation
   * Verifies expiration, revocation, and JWT validation checks
   */
  describe('isRefreshTokenValid', () => {
    it('should return true if token is valid and not revoked or expired', async () => {
      const mockPayload: JwtPayload = {
        sub: '1',
        email: 'test@example.com',
        role: 'user',
        tenantId: null,
        tenantAccess: [],
        sessionId: 'sid',
        type: 'refresh',
      };
      mockJwtService.verify.mockReturnValue(mockPayload);
      const mockToken: Partial<RefreshToken> = {
        id: '1',
        token: 'token',
        expiresAt: new Date(Date.now() + 10000),
        isRevoked: false,
        user: { id: '1' } as User,
        session: { id: '1' } as Session,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRefreshTokenRepository.findOne.mockResolvedValue(
        mockToken as RefreshToken,
      );
      const result = await service.isRefreshTokenValid('token');
      expect(result).toBe(true);
    });
    it('should return false if token is revoked', async () => {
      const mockPayload: JwtPayload = {
        sub: '1',
        email: 'test@example.com',
        role: 'user',
        tenantId: null,
        tenantAccess: [],
        sessionId: 'sid',
        type: 'refresh',
      };
      mockJwtService.verify.mockReturnValue(mockPayload);
      const mockToken: Partial<RefreshToken> = {
        id: '1',
        token: 'token',
        expiresAt: new Date(Date.now() + 10000),
        isRevoked: true,
        user: { id: '1' } as User,
        session: { id: '1' } as Session,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRefreshTokenRepository.findOne.mockResolvedValue(
        mockToken as RefreshToken,
      );
      const result = await service.isRefreshTokenValid('token');
      expect(result).toBe(false);
    });
    it('should return false if token is expired', async () => {
      const mockPayload: JwtPayload = {
        sub: '1',
        email: 'test@example.com',
        role: 'user',
        tenantId: null,
        tenantAccess: [],
        sessionId: 'sid',
        type: 'refresh',
      };
      mockJwtService.verify.mockReturnValue(mockPayload);
      const mockToken: Partial<RefreshToken> = {
        id: '1',
        token: 'token',
        expiresAt: new Date(Date.now() - 10000),
        isRevoked: false,
        user: { id: '1' } as User,
        session: { id: '1' } as Session,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRefreshTokenRepository.findOne.mockResolvedValue(
        mockToken as RefreshToken,
      );
      mockRefreshTokenRepository.update.mockResolvedValue({});
      const result = await service.isRefreshTokenValid('token');
      expect(result).toBe(false);
    });
    it('should return false if token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });
      const result = await service.isRefreshTokenValid('token');
      expect(result).toBe(false);
    });
  });

  /**
   * Tests for refresh token rotation
   * Verifies old token revocation and new token generation
   */
  describe('rotateRefreshToken', () => {
    it('should revoke old token and generate a new one', async () => {
      service.revokeRefreshToken = jest
        .fn()
        .mockImplementation(async () => undefined);
      service.generateRefreshToken = jest
        .fn()
        .mockImplementation(async () => 'new-refresh');
      mockUsersService.findOne.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        role: 'user',
      });
      mockTenantsService.getUserTenantMemberships.mockResolvedValue([]);
      const result = await service.rotateRefreshToken('old', '1', 'sid');
      expect(service.revokeRefreshToken).toHaveBeenCalledWith('old');
      expect(service.generateRefreshToken).toHaveBeenCalled();
      expect(result).toBe('new-refresh');
    });
    it('should throw if user is not found', async () => {
      service.revokeRefreshToken = jest.fn().mockResolvedValue(undefined);
      mockUsersService.findOne.mockResolvedValue(null);
      await expect(
        service.rotateRefreshToken('old', 'notfound', 'sid'),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });
    it('should throw if tenant memberships are missing', async () => {
      service.revokeRefreshToken = jest.fn().mockResolvedValue(undefined);
      mockUsersService.findOne.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        role: 'user',
      });
      mockTenantsService.getUserTenantMemberships.mockResolvedValue([]);
      await expect(
        service.rotateRefreshToken('old', '1', 'sid'),
      ).rejects.toThrow(
        new UnauthorizedException('Invalid tenant memberships'),
      );
    });
  });

  /**
   * Tests for session revocation
   * Verifies session and associated refresh token invalidation
   */
  describe('revokeSession', () => {
    it('should call sessionService.revokeSession and update refresh tokens', async () => {
      mockSessionService.revokeSession.mockResolvedValue(undefined);
      mockRefreshTokenRepository.update.mockResolvedValue({});
      await service.revokeSession('sid');
      expect(mockSessionService.revokeSession).toHaveBeenCalledWith('sid');
      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
        { sessionId: 'sid' },
        expect.objectContaining({ isRevoked: true }),
      );
    });
  });

  /**
   * Tests for token pair generation
   * Verifies user validation and token generation process
   */
  describe('generateTokens', () => {
    it('should throw if user is not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);
      await expect(service.generateTokens('notfound', {})).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });
});
