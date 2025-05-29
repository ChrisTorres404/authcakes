import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { UsersService } from '../../../src/modules/users/services/users.service';
import { TokenService } from '../../../src/modules/auth/services/token.service';
import { SessionService } from '../../../src/modules/auth/services/session.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../../src/modules/users/entities/user.entity';
import { TokenResponseDto } from '../../../src/modules/auth/dto/token-response.dto';
import { RegisterDto } from '../../../src/modules/auth/dto/register.dto';
import { LoginUserDto } from '../../../src/modules/auth/dto/login-response.dto';
import { Session } from '../../../src/modules/auth/entities/session.entity';
import * as bcrypt from 'bcryptjs';

/**
 * Mock service interfaces with strongly typed methods
 */
interface MockUsersService {
  findByEmail: jest.Mock<Promise<Partial<User> | null>, [string]>;
  create: jest.Mock<Promise<Partial<User>>, [Partial<User>]>;
  resetPassword: jest.Mock<Promise<Partial<User>>, [string, string]>;
  changePassword: jest.Mock<Promise<Partial<User>>, [string, string]>;
  findOne: jest.Mock<Promise<Partial<User> | null>, [string]>;
  sendPasswordResetEmail: jest.Mock<Promise<boolean>, [Partial<User>]>;
}

interface MockTokenService {
  generateTokens: jest.Mock<
    Promise<TokenResponseDto>,
    [string, Record<string, unknown>]
  >;
}

interface MockSessionService {
  create: jest.Mock<Promise<Session>, [string, string]>;
  findById: jest.Mock<Promise<Session | null>, [string]>;
  remove: jest.Mock<Promise<void>, [string]>;
}

interface MockJwtService {
  sign: jest.Mock<string, [Record<string, unknown>]>;
  verify: jest.Mock<Record<string, unknown>, [string]>;
}

/**
 * Base mock objects for testing
 * Contains minimal required properties for auth-related tests
 */
const baseMockLoginUser: LoginUserDto = {
  id: '1',
  email: 'test@example.com',
  role: 'user',
  firstName: 'Test',
  lastName: 'User',
  emailVerified: true,
};

// Base mock user for testing
const baseMockUser: Partial<User> = {
  id: '1',
  email: 'test@example.com',
  password: 'hashed_password',
  role: 'user',
  active: true,
  emailVerified: true,
  firstName: 'Test',
  lastName: 'User',
  tenantMemberships: [],
  sessions: [],
  refreshTokens: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUsersService: MockUsersService = {
  findByEmail: jest.fn<Promise<Partial<User> | null>, [string]>(),
  create: jest.fn<Promise<Partial<User>>, [Partial<User>]>(),
  resetPassword: jest.fn<Promise<Partial<User>>, [string, string]>(),
  changePassword: jest.fn<Promise<Partial<User>>, [string, string]>(),
  findOne: jest.fn<Promise<Partial<User> | null>, [string]>(),
  sendPasswordResetEmail: jest.fn<Promise<boolean>, [Partial<User>]>(),
};

const mockTokenService: MockTokenService = {
  generateTokens: jest.fn<
    Promise<TokenResponseDto>,
    [string, Record<string, unknown>]
  >(),
};

const mockSessionService: MockSessionService = {
  create: jest.fn<Promise<Session>, [string, string]>(),
  findById: jest.fn<Promise<Session | null>, [string]>(),
  remove: jest.fn<Promise<void>, [string]>(),
};

const mockJwtService: MockJwtService = {
  sign: jest.fn<string, [Record<string, unknown>]>(),
  verify: jest.fn<Record<string, unknown>, [string]>(),
};

/**
 * Test suite for AuthService
 * Verifies authentication functionality including user validation,
 * registration, password management, and token operations
 */
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async (): Promise<void> => {
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

  /**
   * Tests for user validation functionality
   * Verifies email/password validation and user retrieval
   */
  describe('validateUser', () => {
    it('should throw if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.validateUser('test@example.com', 'pass'),
      ).rejects.toThrow();
    });

    it('should throw if password does not match', async () => {
      const mockUser = { ...baseMockUser };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));
      await expect(
        service.validateUser('test@example.com', 'wrongpass'),
      ).rejects.toThrow();
    });
    it('should return user if credentials are valid', async () => {
      const mockUser = { ...baseMockUser };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      const result = await service.validateUser(
        'test@example.com',
        'correctpass',
      );
      expect(result).toBe(mockUser);
    });
  });

  /**
   * Tests for user registration functionality
   * Verifies duplicate email handling and successful registration
   */
  describe('register', () => {
    it('should throw if email already in use', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ ...baseMockUser });
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
      };
      await expect(service.register(registerDto)).rejects.toThrow();
    });
    it('should call create and generateTokens if email is new', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const newUser = { ...baseMockUser, id: '2', email: 'new@example.com' };
      mockUsersService.create.mockResolvedValue(newUser);
      const mockTokenResponse: TokenResponseDto = {
        success: true,
        user: {
          ...baseMockLoginUser,
          id: '2',
          email: 'new@example.com',
        },
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      };
      mockTokenService.generateTokens.mockResolvedValue(mockTokenResponse);
      const registerDto: RegisterDto = {
        email: 'new@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
      };
      const result = await service.register(registerDto);
      expect(mockUsersService.create).toHaveBeenCalled();
      expect(mockTokenService.generateTokens).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
    });
  });

  /**
   * Tests for password reset functionality
   * Verifies token validation and password update process
   */
  describe('resetPassword', () => {
    it('should call usersService.resetPassword', async () => {
      const updatedUser = { ...baseMockUser };
      mockUsersService.resetPassword.mockResolvedValue(updatedUser);
      const result = await service.resetPassword('token', 'newpass');
      expect(mockUsersService.resetPassword).toHaveBeenCalledWith(
        'token',
        'newpass',
      );
      expect(result).toHaveProperty('email');
    });
  });

  /**
   * Tests for password change functionality
   * Verifies current password validation and update process
   */
  describe('changePassword', () => {
    it('should throw if user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);
      await expect(service.changePassword('1', 'old', 'new')).rejects.toThrow();
    });
    it('should throw if old password does not match', async () => {
      mockUsersService.findOne.mockResolvedValue({ ...baseMockUser });
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));
      await expect(
        service.changePassword('1', 'wrongold', 'new'),
      ).rejects.toThrow();
    });
    it('should call changePassword if old password matches', async () => {
      const user = { ...baseMockUser };
      mockUsersService.findOne.mockResolvedValue(user);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      mockUsersService.changePassword.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
      });
      const result = await service.changePassword('1', 'old', 'new');
      expect(mockUsersService.changePassword).toHaveBeenCalledWith('1', 'new');
      expect(result).toHaveProperty('email');
    });
  });

  /**
   * Tests for password reset request functionality
   * Verifies user existence and email sending process
   */
  describe('requestPasswordReset', () => {
    it('should throw if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.requestPasswordReset('notfound@example.com'),
      ).rejects.toThrow();
    });
    it('should call sendPasswordResetEmail if user exists', async () => {
      const user = { ...baseMockUser };
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.sendPasswordResetEmail.mockResolvedValue(true);
      const result = await service.requestPasswordReset('test@example.com');
      expect(mockUsersService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  /**
   * Tests for token refresh functionality
   * Verifies token generation and session management
   */
  describe('refresh', () => {
    it('should call tokenService.generateTokens', async () => {
      const mockTokenResponse: TokenResponseDto = {
        success: true,
        user: {
          ...baseMockLoginUser,
          id: '1',
          email: 'test@example.com',
        },
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      };
      mockTokenService.generateTokens.mockResolvedValue(mockTokenResponse);
      const result = await service.refresh('1', 'sid', {});
      expect(mockTokenService.generateTokens).toHaveBeenCalledWith('1', {});
      expect(result).toHaveProperty('accessToken');
    });
  });
});
