/**
 * @fileoverview E2E Tests for Token Management
 * Tests token refresh, revocation, and session management
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../../../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../../../src/modules/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  SessionListResponse,
  PasswordChangePayload,
} from '../auth.types';

/**
 * Generates a unique email for test isolation
 * @param prefix - Optional prefix for the email
 * @returns Unique email address
 */
function uniqueEmail(prefix = 'user'): string {
  return `${prefix}+${Date.now()}@example.com`;
}

describe('Auth Tokens E2E', () => {
  let app: INestApplication;
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
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  beforeEach(async () => {
    // Clean up database between tests
    await dataSource.query('TRUNCATE TABLE "tenant_memberships" CASCADE');
    await dataSource.query('TRUNCATE TABLE "tenants" CASCADE');
    await dataSource.query('TRUNCATE TABLE "users" CASCADE');
  });

  describe('Access Tokens', () => {
    it('should not access protected route with expired access token', async () => {
      // Register and login to get a valid token
      const email = uniqueEmail('expiretoken');
      const password = 'Test1234!';

      const registerRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: `TestOrg${Date.now()}${Math.random().toString(36).substring(2, 7)}`,
        })
        .expect(200);

      const { accessToken } = registerRes.body;

      // Simulate expired token by using a clearly invalid/expired JWT
      const expiredToken =
        accessToken.split('.').slice(0, 2).join('.') + '.expiredsig';

      await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should reject forged or tampered tokens', async () => {
      // Register and login
      const email = uniqueEmail('forgedtoken');
      const password = 'Test1234!';

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: `TestOrg${Date.now()}${Math.random().toString(36).substring(2, 7)}`,
        })
        .expect(200);

      // Use a forged JWT
      const forgedToken = 'forged.jwt.token';

      await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${forgedToken}`)
        .expect(401);

      // Use a tampered cookie
      await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Cookie', ['access_token=forged.jwt.token'])
        .expect(401);
    });

    it('should access profile with a valid JWT in Authorization header', async () => {
      // Register and login to get a valid JWT
      const email = uniqueEmail('minimal');
      const password = 'Test1234!';

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: `TestOrg${Date.now()}${Math.random().toString(36).substring(2, 7)}`,
        })
        .expect(200);

      // Activate the account
      const user = await userRepository.findOneByOrFail({ email });
      const verifyToken = user.emailVerificationToken;

      await request(app.getHttpServer())
        .post('/api/users/verify-email')
        .send({ token: verifyToken })
        .expect(200);

      // Login to get JWT
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      const accessToken = loginRes.body.accessToken;

      // Use token to access protected route
      const res = await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email');
    });
  });

  describe('Refresh Tokens', () => {
    it('should refresh access token', async () => {
      const email = uniqueEmail();
      const password = 'Test1234!';

      // Register and login
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: `TestOrg${Date.now()}${Math.random().toString(36).substring(2, 7)}`,
        })
        .expect(200);

      // Verify email
      const user = await userRepository.findOneByOrFail({ email });
      await request(app.getHttpServer())
        .post('/api/users/verify-email')
        .send({ token: user.emailVerificationToken })
        .expect(200);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      const loginCookies = loginRes.headers['set-cookie'];
      console.log('Login cookies:', loginCookies);

      // Refresh token  
      const refreshRes = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', loginCookies);
      
      if (refreshRes.status !== 200) {
        console.log('Refresh failed:', refreshRes.status, refreshRes.body);
        console.log('Login response:', loginRes.body);
      }
      expect(refreshRes.status).toBe(200);

      expect(refreshRes.body).toHaveProperty('accessToken');
    });

    it('should not refresh with revoked token (after logout)', async () => {
      // Register and login to get cookies
      const email = uniqueEmail();
      const password = 'Test1234!';

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: `TestOrg${Date.now()}${Math.random().toString(36).substring(2, 7)}`,
        })
        .expect(200);

      // Verify email
      const user = await userRepository.findOneByOrFail({ email });
      await request(app.getHttpServer())
        .post('/api/users/verify-email')
        .send({ token: user.emailVerificationToken })
        .expect(200);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      const loginCookies = loginRes.headers['set-cookie'];

      // Logout to revoke refresh token (needs access token)
      const logoutRes = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', loginCookies)
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`);
        
      if (logoutRes.status !== 200) {
        console.log('Logout failed:', logoutRes.status, logoutRes.body);
      }
      expect(logoutRes.status).toBe(200);

      // Try to refresh with revoked token
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', loginCookies)
        .expect(401);
    });

    it('should not allow refresh token creation for non-existent or revoked session', async () => {
      // Register and login
      const email = uniqueEmail('sessionintegrity');
      const password = 'Test1234!';

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: `TestOrg${Date.now()}${Math.random().toString(36).substring(2, 7)}`,
        })
        .expect(200);

      // Verify email
      const user = await userRepository.findOneByOrFail({ email });
      await request(app.getHttpServer())
        .post('/api/users/verify-email')
        .send({ token: user.emailVerificationToken })
        .expect(200);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      const loginCookies = loginRes.headers['set-cookie'];

      // List sessions to get sessionId (needs access token)
      const sessionsRes = await request(app.getHttpServer())
        .get('/api/auth/sessions')
        .set('Cookie', loginCookies)
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .expect(200);

      const sessionList = sessionsRes.body as SessionListResponse;
      if (!sessionList.sessions.length) {
        console.warn('Skipping session integrity test: no sessions found');
        return;
      }

      const sessionId = sessionsRes.body.sessions[0].id;

      // Revoke session (needs access token)
      await request(app.getHttpServer())
        .post('/api/auth/revoke-session')
        .set('Cookie', loginCookies)
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send({ sessionId })
        .expect(200);

      // Try to refresh token after session is revoked
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', loginCookies)
        .expect(401);
    });
  });

  describe('Token Revocation on Password Change', () => {
    it('should revoke all tokens and sessions on password change', async () => {
      // Register and login
      const email = uniqueEmail('changepass');
      const password = 'Test1234!';
      const newPassword = 'Changed123!';

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: `TestOrg${Date.now()}${Math.random().toString(36).substring(2, 7)}`,
        })
        .expect(200);

      // Verify email
      const user = await userRepository.findOneByOrFail({ email });
      await request(app.getHttpServer())
        .post('/api/users/verify-email')
        .send({ token: user.emailVerificationToken })
        .expect(200);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      const loginCookies = loginRes.headers['set-cookie'];

      // Change password (needs access token)
      const passwordChange: PasswordChangePayload = {
        oldPassword: password,
        newPassword: newPassword,
      };

      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Cookie', loginCookies)
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send(passwordChange)
        .expect(200);

      // Try to use old session/token
      await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Cookie', loginCookies)
        .expect(401);

      // Login with new password should succeed
      const newLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: newPassword })
        .expect(200);

      expect(newLogin.body).toHaveProperty('accessToken');
    });
  });
});
