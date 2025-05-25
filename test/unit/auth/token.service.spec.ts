import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from '../../../src/modules/auth/services/token.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../../src/modules/users/services/users.service';
import { TenantsService } from '../../../src/modules/tenants/services/tenants.service';
import { SessionService } from '../../../src/modules/auth/services/session.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from '../../../src/modules/auth/entities/refresh-token.entity';

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};
const mockUsersService = {
  findOne: jest.fn(),
};
const mockTenantsService = {
  getUserTenantMemberships: jest.fn(),
};
const mockSessionService = {
  createSession: jest.fn(),
  revokeSession: jest.fn(),
  getActiveSessions: jest.fn(),
};
const mockRefreshTokenRepository = {
  save: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: TenantsService, useValue: mockTenantsService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshTokenRepository },
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

  describe('generateAccessToken', () => {
    it('should call jwtService.sign with payload', () => {
      const payload = { sub: '1', email: 'test@example.com' };
      mockJwtService.sign.mockReturnValue('signed-token');
      const token = service.generateAccessToken(payload as any);
      expect(mockJwtService.sign).toHaveBeenCalledWith(payload, expect.any(Object));
      expect(token).toBe('signed-token');
    });
  });

  describe('generateRefreshToken', () => {
    it('should save refresh token and return it', async () => {
      mockJwtService.sign.mockReturnValue('refresh-token');
      mockRefreshTokenRepository.save.mockResolvedValue({});
      const payload = { sub: '1', sessionId: 'sid' };
      const token = await service.generateRefreshToken(payload as any);
      expect(mockRefreshTokenRepository.save).toHaveBeenCalled();
      expect(token).toBe('refresh-token');
    });
    it('should throw if repository save fails', async () => {
      mockJwtService.sign.mockReturnValue('refresh-token');
      mockRefreshTokenRepository.save.mockRejectedValue(new Error('DB error'));
      const payload = { sub: '1', sessionId: 'sid' };
      await expect(service.generateRefreshToken(payload as any)).rejects.toThrow('DB error');
    });
  });

  describe('revokeRefreshToken', () => {
    it('should update the refresh token as revoked', async () => {
      mockRefreshTokenRepository.update.mockResolvedValue({});
      await service.revokeRefreshToken('token');
      expect(mockRefreshTokenRepository.update).toHaveBeenCalled();
    });
  });

  describe('isRefreshTokenValid', () => {
    it('should return true if token is valid and not revoked or expired', async () => {
      mockJwtService.verify.mockReturnValue({});
      mockRefreshTokenRepository.findOne.mockResolvedValue({
        expiresAt: new Date(Date.now() + 10000),
        revoked: false,
      });
      const result = await service.isRefreshTokenValid('token');
      expect(result).toBe(true);
    });
    it('should return false if token is revoked', async () => {
      mockJwtService.verify.mockReturnValue({});
      mockRefreshTokenRepository.findOne.mockResolvedValue({
        expiresAt: new Date(Date.now() + 10000),
        revoked: true,
      });
      const result = await service.isRefreshTokenValid('token');
      expect(result).toBe(false);
    });
    it('should return false if token is expired', async () => {
      mockJwtService.verify.mockReturnValue({});
      mockRefreshTokenRepository.findOne.mockResolvedValue({
        expiresAt: new Date(Date.now() - 10000),
        revoked: false,
      });
      mockRefreshTokenRepository.update.mockResolvedValue({});
      const result = await service.isRefreshTokenValid('token');
      expect(result).toBe(false);
    });
    it('should return false if token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('invalid'); });
      const result = await service.isRefreshTokenValid('token');
      expect(result).toBe(false);
    });
  });

  describe('rotateRefreshToken', () => {
    it('should revoke old token and generate a new one', async () => {
      service.revokeRefreshToken = jest.fn().mockResolvedValue(undefined);
      service.generateRefreshToken = jest.fn().mockResolvedValue('new-refresh');
      mockUsersService.findOne.mockResolvedValue({ id: '1', email: 'test@example.com', role: 'user' });
      mockTenantsService.getUserTenantMemberships.mockResolvedValue([]);
      const result = await service.rotateRefreshToken('old', '1', 'sid');
      expect(service.revokeRefreshToken).toHaveBeenCalledWith('old');
      expect(service.generateRefreshToken).toHaveBeenCalled();
      expect(result).toBe('new-refresh');
    });
    it('should throw if user is not found', async () => {
      service.revokeRefreshToken = jest.fn().mockResolvedValue(undefined);
      mockUsersService.findOne.mockResolvedValue(null);
      await expect(service.rotateRefreshToken('old', 'notfound', 'sid')).rejects.toThrow('User not found');
    });
    it('should throw if tenant memberships are missing', async () => {
      service.revokeRefreshToken = jest.fn().mockResolvedValue(undefined);
      mockUsersService.findOne.mockResolvedValue({ id: '1', email: 'test@example.com', role: 'user' });
      mockTenantsService.getUserTenantMemberships.mockResolvedValue(undefined);
      await expect(service.rotateRefreshToken('old', '1', 'sid')).rejects.toThrow();
    });
  });

  describe('revokeSession', () => {
    it('should call sessionService.revokeSession and update refresh tokens', async () => {
      mockSessionService.revokeSession.mockResolvedValue(undefined);
      mockRefreshTokenRepository.update.mockResolvedValue({});
      await service.revokeSession('sid');
      expect(mockSessionService.revokeSession).toHaveBeenCalledWith('sid');
      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
        { sessionId: 'sid' },
        expect.objectContaining({ revoked: true })
      );
    });
  });

  describe('generateTokens', () => {
    it('should throw if user is not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);
      await expect(service.generateTokens('notfound', {})).rejects.toThrow('User not found');
    });
  });
}); 