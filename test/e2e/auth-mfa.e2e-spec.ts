/**
 * @fileoverview E2E Tests for Multi-Factor Authentication
 * Tests MFA enrollment, verification, and recovery flows
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../src/modules/users/entities/user.entity';
import { AuthService } from '../../src/modules/auth/services/auth.service';
import { UsersService } from '../../src/modules/users/services/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  AuthTestResponse,
  MfaType,
  MfaEnrollRequest,
  MfaEnrollResponse,
  MfaVerifyRequest,
  MfaVerifyResponse,
  MfaSetupStatus,
} from './types/auth.types';

/**
 * Generates a unique email for test isolation
 * @param prefix - Optional prefix for the email
 * @returns Unique email address
 */
function uniqueEmail(prefix = 'user'): string {
  return `${prefix}+${Date.now()}@example.com`;
}

describe('Auth MFA E2E', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let userRepository: Repository<User>;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.THROTTLE_SKIP = 'true';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.enableCors({
      origin: ['http://localhost:3000', 'https://your-frontend.com'],
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type,Authorization',
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    dataSource = app.get(DataSource);
    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  describe('MFA Enrollment and Verification', () => {
    it('should handle MFA enrollment and verification flow', async () => {
      // Register and login
      const email = uniqueEmail('mfauser');
      const password = 'Test1234!';

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg',
        })
        .expect(200);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      const loginCookies = loginRes.headers['set-cookie'];

      // Enroll in MFA
      const enrollRequest: MfaEnrollRequest = {
        type: 'totp',
      };

      const enrollRes = await request(app.getHttpServer())
        .post('/api/auth/mfa/enroll')
        .set('Cookie', loginCookies)
        .send(enrollRequest)
        .expect(200);

      const enrollResponse = enrollRes.body as MfaEnrollResponse;
      expect(enrollResponse.secret).toBeDefined();
      expect(enrollResponse.setupStatus).toBe('pending');

      // Simulate user entering correct MFA code
      const verifyRequest: MfaVerifyRequest = {
        code: '123456', // Mock code for testing
        type: 'totp',
      };

      const verifyRes = await request(app.getHttpServer())
        .post('/api/auth/mfa/verify')
        .set('Cookie', loginCookies)
        .send(verifyRequest)
        .expect(200);

      const verifyResponse = verifyRes.body as MfaVerifyResponse;
      expect(verifyResponse.success).toBe(true);

      // Verify MFA setup status
      const user = await userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.mfaRecoveryCodes', 'recoveryCodes')
        .where('user.email = :email', { email })
        .getOne();

      if (!user) {
        throw new Error('User not found');
      }

      // Verify MFA is properly enabled
      expect(user.mfaEnabled).toBe(true);
      expect(user.mfaType).toBe('totp');
      expect(user.mfaSecret).toBeDefined();

      // Verify recovery codes were generated
      expect(user.mfaRecoveryCodes).toBeDefined();
      expect(user.mfaRecoveryCodes.length).toBeGreaterThan(0);
    });
  });
});
