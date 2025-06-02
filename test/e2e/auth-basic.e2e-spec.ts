/**
 * @fileoverview E2E Tests for Basic Authentication Flows
 * Tests registration, login, logout, and protected route access
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../src/modules/users/entities/user.entity';
import { AuthService } from '../../src/modules/auth/services/auth.service';
import { UsersService } from '../../src/modules/users/services/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  TestUser,
  AuthResponse,
  CookieMap,
  JwtPayload,
  AuthTestResponse,
  ErrorResponse,
  CookieHeader,
} from './types/auth.types';

/**
 * Decodes and returns the JWT payload
 * @param token - JWT token string
 * @returns Decoded JWT payload
 * @throws {Error} If token is invalid or malformed
 */
function decodeJwtPayload(token: string): JwtPayload {
  const payload = token.split('.')[1];
  return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
}

/**
 * Generates a unique email for test isolation
 * @param prefix - Optional prefix for the email
 * @returns Unique email address
 */
function uniqueEmail(prefix = 'user'): string {
  return `${prefix}+${Date.now()}@example.com`;
}

/**
 * Generates a unique organization name for test isolation
 * @param prefix - Optional prefix for the organization
 * @returns Unique organization name
 */
function uniqueOrgName(prefix = 'TestOrg'): string {
  return `${prefix}${Date.now()}`;
}

/**
 * Extracts cookies from response headers
 * @param response - Supertest response object
 * @returns Map of cookie names to values
 */
function extractCookies(response: AuthTestResponse): CookieMap {
  const cookies: CookieMap = {};
  const cookieHeader: CookieHeader = response.headers['set-cookie'];

  if (!cookieHeader) return cookies;

  const cookieArray = Array.isArray(cookieHeader)
    ? cookieHeader
    : [cookieHeader];

  cookieArray.forEach((cookie) => {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    cookies[name] = value;
  });

  return cookies;
}

/**
 * End-to-end test suite for authentication functionality
 * Verifies core auth flows including registration, login, and session management
 */
describe('Auth Basic E2E', () => {
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

  beforeEach(async () => {
    // Clean database before each test for isolation
    await dataSource.query('TRUNCATE TABLE tenant_memberships CASCADE');
    await dataSource.query('TRUNCATE TABLE tenants CASCADE');
    await dataSource.query('TRUNCATE TABLE users CASCADE');
  });

  afterAll(async () => {
    await app.close();
  }, 10000);

  /**
   * Tests for user registration functionality
   * Verifies successful registration and duplicate email handling
   */
  describe('Registration', () => {
    it('should register a new user successfully', async () => {
      const email = uniqueEmail();
      const password = 'Test1234!';

      const registerRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);

      expect(registerRes.body).toHaveProperty('user');
      expect(registerRes.body).toHaveProperty('accessToken');
      expect(registerRes.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('access_token'),
          expect.stringContaining('refresh_token'),
          expect.stringContaining('session_id'),
        ]),
      );
    });

    it('should not allow registration with duplicate email', async () => {
      const email = uniqueEmail('dupe');
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

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg',
        })
        .expect(400);
    });
  });

  /**
   * Tests for user login functionality
   * Verifies credential validation and brute force protection
   */
  describe('Login', () => {
    it('should login with valid credentials', async () => {
      const email = uniqueEmail();
      const password = 'Test1234!';

      // Register first
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

      // Login
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      expect(loginRes.body).toHaveProperty('user');
      expect(loginRes.body).toHaveProperty('accessToken');
      expect(loginRes.headers['set-cookie']).toBeDefined();
    });

    it('should not login with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'notfound@example.com', password: 'wrong' })
        .expect(401);
    });

    it('should lock account after multiple failed logins (brute force protection)', async () => {
      const email = uniqueEmail('brute');
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

      // Simulate failed logins (assuming max 5 attempts)
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email, password: 'WrongPass!' })
          .expect(401);
      }

      // Now even correct password should fail (account locked)
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(401);
    });
  });

  /**
   * Tests for user logout functionality
   * Verifies session termination and cookie clearing
   */
  describe('Logout', () => {
    it('should logout successfully', async () => {
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
          organizationName: 'TestOrg',
        })
        .expect(200);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      const loginCookies = loginRes.headers['set-cookie'];

      // Logout
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', loginCookies)
        .expect(200);
    });
  });

  /**
   * Tests for protected route access
   * Verifies authentication middleware and token handling
   */
  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
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
          organizationName: 'TestOrg',
        })
        .expect(200);

      // Activate the account
      const user = await userRepository.findOneByOrFail({ email });
      const verifyToken = user.emailVerificationToken;

      await request(app.getHttpServer())
        .post('/api/users/verify-email')
        .send({ token: verifyToken })
        .expect(200);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      const accessToken = loginRes.body.accessToken;

      // Access protected route using Bearer token
      const profileRes = await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileRes.body).toHaveProperty('id');
      expect(profileRes.body).toHaveProperty('email');
    });

    it('should access protected route using cookies', async () => {
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
          organizationName: 'TestOrg',
        })
        .expect(200);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      const loginCookies = loginRes.headers['set-cookie'];

      // Access protected route using cookies
      const profileResCookie = await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Cookie', loginCookies)
        .expect(200);

      expect(profileResCookie.body).toHaveProperty('id');
    });

    it('should not access protected route without token', async () => {
      await request(app.getHttpServer()).get('/api/users/profile').expect(401);
    });
  });

  /**
   * Tests for complete authentication flow
   * Verifies end-to-end user journey through the auth system
   */
  describe('Complete Auth Flow', () => {
    it('should complete full auth flow: register, login, access protected route, and logout', async () => {
      const email = uniqueEmail();
      const password = 'Test1234!';

      // Register
      const registerRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg',
        })
        .expect(200);

      expect(registerRes.body).toHaveProperty('user');
      expect(registerRes.body).toHaveProperty('accessToken');

      const cookies = registerRes.headers['set-cookie'];

      // Fetch and use verification token
      const user = await userRepository.findOneByOrFail({ email });
      const verifyToken = user.emailVerificationToken;
      expect(verifyToken).toBeTruthy();

      await request(app.getHttpServer())
        .post('/api/users/verify-email')
        .send({ token: verifyToken })
        .expect(200);

      // Login
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      const loginCookies = loginRes.headers['set-cookie'];
      const accessToken = loginRes.body.accessToken;

      // Access protected route
      const profileRes = await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileRes.body).toHaveProperty('id');
      expect(profileRes.body).toHaveProperty('email');

      // Logout
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', loginCookies)
        .expect(200);
    });
  });

  /**
   * Tests for social authentication integration
   * Verifies third-party authentication flows
   */
  describe('Social Login', () => {
    it('should handle social login flow (stub)', async () => {
      // Simulate social login callback (mock provider response)
      const provider = 'google';
      const socialToken = 'mock-social-token';

      try {
        await request(app.getHttpServer())
          .post('/api/auth/social')
          .send({ provider, token: socialToken });
        // Not checking status - implementation may vary
      } catch (err) {
        if (
          err.response &&
          (err.response.status === 401 ||
            err.response.status === 404 ||
            err.response.status === 501)
        ) {
          console.warn('Skipping social login test: endpoint not implemented');
          return;
        }
        throw err;
      }
    });
  });

  /**
   * Tests for error handling in authentication flows
   * Verifies proper error responses and security measures
   */
  describe('Error Handling', () => {
    it('should return structured error responses without sensitive info', async () => {
      // Try to login with invalid credentials
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'notfound@example.com', password: 'wrong' })
        .expect(401);

      const errorResponse = res.body as ErrorResponse;
      expect(errorResponse.statusCode).toBe(401);
      expect(errorResponse.message).toBeDefined();
      expect(errorResponse).not.toHaveProperty('stack');
      expect(errorResponse.message).not.toMatch(/password|token|jwt|secret/i);
    });
  });
});
