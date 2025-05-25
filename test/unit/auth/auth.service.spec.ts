import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { UsersService } from '../../../src/modules/users/services/users.service';
import { TokenService } from '../../../src/modules/auth/services/token.service';
import { SessionService } from '../../../src/modules/auth/services/session.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  resetPassword: jest.fn(),
  changePassword: jest.fn(),
  findOne: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
};
const mockTokenService = {
  generateTokens: jest.fn(),
};
const mockSessionService = {};
const mockJwtService = {};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should throw if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.validateUser('test@example.com', 'pass')).rejects.toThrow();
    });
    it('should throw if password does not match', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: '1', email: 'test@example.com', password: 'hashed' });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      await expect(service.validateUser('test@example.com', 'wrongpass')).rejects.toThrow();
    });
    it('should return user if credentials are valid', async () => {
      const user = { id: '1', email: 'test@example.com', password: 'hashed' };
      mockUsersService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      const result = await service.validateUser('test@example.com', 'correctpass');
      expect(result).toBe(user);
    });
  });

  describe('register', () => {
    it('should throw if email already in use', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: '1', email: 'test@example.com' });
      await expect(service.register({ email: 'test@example.com' })).rejects.toThrow();
    });
    it('should call create and generateTokens if email is new', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({ id: '2', email: 'new@example.com' });
      mockTokenService.generateTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
      const result = await service.register({ email: 'new@example.com' });
      expect(mockUsersService.create).toHaveBeenCalled();
      expect(mockTokenService.generateTokens).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('resetPassword', () => {
    it('should call usersService.resetPassword', async () => {
      mockUsersService.resetPassword.mockResolvedValue({ id: '1', email: 'test@example.com' });
      const result = await service.resetPassword('token', 'newpass');
      expect(mockUsersService.resetPassword).toHaveBeenCalledWith('token', 'newpass');
      expect(result).toHaveProperty('email');
    });
  });

  describe('changePassword', () => {
    it('should throw if user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);
      await expect(service.changePassword('1', 'old', 'new')).rejects.toThrow();
    });
    it('should throw if old password does not match', async () => {
      mockUsersService.findOne.mockResolvedValue({ id: '1', password: 'hashed' });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      await expect(service.changePassword('1', 'wrongold', 'new')).rejects.toThrow();
    });
    it('should call changePassword if old password matches', async () => {
      mockUsersService.findOne.mockResolvedValue({ id: '1', password: 'hashed' });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      mockUsersService.changePassword.mockResolvedValue({ id: '1', email: 'test@example.com' });
      const result = await service.changePassword('1', 'old', 'new');
      expect(mockUsersService.changePassword).toHaveBeenCalledWith('1', 'new');
      expect(result).toHaveProperty('email');
    });
  });

  describe('requestPasswordReset', () => {
    it('should throw if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.requestPasswordReset('notfound@example.com')).rejects.toThrow();
    });
    it('should call sendPasswordResetEmail if user exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: '1', email: 'test@example.com' });
      mockUsersService.sendPasswordResetEmail.mockResolvedValue(true);
      const result = await service.requestPasswordReset('test@example.com');
      expect(mockUsersService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('refresh', () => {
    it('should call tokenService.generateTokens', async () => {
      mockTokenService.generateTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
      const result = await service.refresh('1', 'sid', {});
      expect(mockTokenService.generateTokens).toHaveBeenCalledWith('1', {});
      expect(result).toHaveProperty('accessToken');
    });
  });
}); 