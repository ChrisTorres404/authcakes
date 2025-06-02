/**
 * @fileoverview E2E Tests for Multi-Factor Authentication
 * Tests MFA enrollment, verification, and recovery flows
 */
// Import test setup before any other imports to ensure environment is configured
import '../test-setup';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
const cookieParser = require('cookie-parser');
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
const speakeasy = require('speakeasy');

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
    // Environment is already set by test-setup.ts
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
    
    // Run migrations to ensure schema is present and log results
    console.log('Running migrations for test database...');
    const migrations = await dataSource.runMigrations();
    console.log(`Applied ${migrations.length} migrations:`, 
      migrations.map(m => m.name).join(', '));
    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  beforeEach(async () => {
    // Enterprise-grade: Truncate all tables and reset sequences for test isolation
    const tableNames = [
      'mfa_recovery_codes',
      'webauthn_credentials',
      'password_history',
      'user_devices',
      'refresh_tokens',
      'sessions',
      'api_keys',
      'logs',
      'tenant_memberships',
      'tenant_invitations',
      'tenants',
      'system_settings',
      'users',
    ];
    for (const table of tableNames) {
      await dataSource.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
    }
  });

  describe('MFA Enrollment and Verification', () => {
    it('should handle MFA enrollment and verification flow', async () => {
      // Register and login
      const email = uniqueEmail('mfauser');
      const password = 'Test1234!';
      const organizationName = `TestOrg-${Date.now()}`;

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName,
        })
        .expect(200);

      // Fetch user after registration
      const registeredUser = await userRepository.findOne({ where: { email } });
      console.log('[TEST] Registered user:', { id: registeredUser?.id, email: registeredUser?.email });
      // Enterprise-grade: Ensure no other users exist with the same ID
      const usersWithSameId = await userRepository.find({ where: { id: registeredUser?.id } });
      console.log('[TEST] Users with same ID:', usersWithSameId);
      expect(usersWithSameId.length).toBe(1);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      // Fetch user after login
      const loggedInUser = await userRepository.findOne({ where: { email } });
      console.log('[TEST] Logged in user:', { id: loggedInUser?.id, email: loggedInUser?.email });

      const loginCookies = loginRes.headers['set-cookie'];

      // Use the access token cookie for authentication in enroll step
      const accessTokenCookie = loginCookies.find((c) => c.startsWith('access_token='));
      expect(accessTokenCookie).toBeDefined();
      // Use the access token in both the Authorization header and as a cookie for enterprise compatibility
      // Preferred method for frontend: Authorization header (Bearer token)
      const accessToken = accessTokenCookie.split('=')[1].split(';')[0];

      // Print the email before enroll request
      console.log('[TEST] Enroll request for email:', email);
      const enrollRes = await request(app.getHttpServer())
        .post('/api/auth/mfa/enroll')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', accessTokenCookie)
        .expect(200);

      const enrollResponse = enrollRes.body as MfaEnrollResponse;
      expect(enrollResponse.secret).toBeDefined();
      expect(enrollResponse.setupStatus).toBe('pending');

      // Enterprise best practice: Poll for DB consistency before verifying MFA
      const pollForMfaSecret = async (email, timeoutMs = 2000, intervalMs = 100) => {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
          const user = await userRepository
            .createQueryBuilder('user')
            .where('user.email = :email', { email })
            .getOne();
          if (user && user.mfaSecret) return user.mfaSecret;
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
        throw new Error('MFA secret was not set in time');
      };
      await pollForMfaSecret(email);

      // Fetch the persisted secret from the database for enterprise realism
      const persistedUser = await userRepository
        .createQueryBuilder('user')
        .where('user.email = :email', { email })
        .getOne();
      if (!persistedUser || !persistedUser.mfaSecret) {
        throw new Error('Persisted MFA secret not found');
      }
      // Log the persisted secret for debugging
      console.log('[TEST] Persisted mfaSecret after enroll:', persistedUser.mfaSecret);

      // Simulate user entering correct MFA code using the persisted secret
      const validTotpCode = speakeasy.totp({
        secret: persistedUser.mfaSecret,
        encoding: 'base32',
      });
      // Log for debugging
      console.log('[TEST] TOTP code:', validTotpCode, 'secret:', persistedUser.mfaSecret, 'time:', Date.now());
      // Enterprise best practice: Wait for DB consistency before verifying MFA
      await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
      const verifyRequest: MfaVerifyRequest = {
        code: validTotpCode, // Use generated code
        type: 'totp',
      };

      // Print the email before verify request
      console.log('[TEST] Verify request for email:', email);
      const verifyRes = await request(app.getHttpServer())
        .post('/api/auth/mfa/verify')
        .set('Cookie', loginCookies)
        .send(verifyRequest)
        .expect(200);
      const verifyResponse = verifyRes.body as MfaVerifyResponse;
      // Log the verify response for debugging and audit
      console.log('verifyRes.body:', verifyRes.body);
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
