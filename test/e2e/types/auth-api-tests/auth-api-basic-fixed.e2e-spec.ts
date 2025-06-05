/**
 * @fileoverview API-based E2E Tests for Basic Authentication Flows
 * Tests basic auth flows from an API consumer perspective using proper NestJS test setup
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../../../src/app.module';
import { DataSource } from 'typeorm';

/**
 * Helper function to generate unique email addresses for test isolation
 */
function uniqueEmail(prefix = 'user'): string {
  return `${prefix}+${Date.now()}${Math.random().toString(36).substring(2, 7)}@example.com`;
}

/**
 * Helper function to generate unique organization names
 */
function uniqueOrgName(prefix = 'TestOrg'): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).substring(2, 5)}`;
}

/**
 * Helper to extract cookies from response headers
 */
function extractCookies(response: any): Record<string, string> {
  const cookies: Record<string, string> = {};
  const cookieHeader = response.headers['set-cookie'];
  
  if (!cookieHeader) return cookies;
  
  const cookieArray = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
  
  cookieArray.forEach((cookie: string) => {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    cookies[name] = value;
  });
  
  return cookies;
}

/**
 * Helper to format cookies for requests
 */
function formatCookiesForRequest(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

describe('Auth API Basic E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  
  // Test data that will be shared across related tests
  let testUser: {
    email: string;
    password: string;
    accessToken?: string;
    refreshToken?: string;
    cookies?: Record<string, string>;
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.THROTTLE_SKIP = 'true';
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.enableCors({
      origin: ['http://localhost:3000', 'https://app.example.com'],
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type,Authorization',
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    
    dataSource = app.get(DataSource);
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  beforeEach(async () => {
    // Clean up database between tests
    await dataSource.query('TRUNCATE TABLE "refresh_tokens" CASCADE');
    await dataSource.query('TRUNCATE TABLE "sessions" CASCADE');
    await dataSource.query('TRUNCATE TABLE "password_history" CASCADE');
    await dataSource.query('TRUNCATE TABLE "tenant_memberships" CASCADE');
    await dataSource.query('TRUNCATE TABLE "tenants" CASCADE');
    await dataSource.query('TRUNCATE TABLE "users" CASCADE');
  });

  /**
   * Registration API Tests
   */
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const email = uniqueEmail('register');
      const password = 'Test1234!';
      const organizationName = uniqueOrgName();

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName,
        })
        .expect(200)
        .expect('Content-Type', /json/);

      // Verify response structure
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      
      // Verify user object structure
      expect(response.body.user).toMatchObject({
        email,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        emailVerified: false,
      });
      
      // Should not expose sensitive data
      expect(response.body.user).not.toHaveProperty('password');
      
      // Verify tokens are valid JWT format
      expect(response.body.accessToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
      expect(response.body.refreshToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
      
      // Verify cookies are set
      const cookies = extractCookies(response);
      expect(cookies).toHaveProperty('access_token');
      expect(cookies).toHaveProperty('refresh_token');
      expect(cookies).toHaveProperty('session_id');
    });

    it('should not allow registration with duplicate email', async () => {
      const email = uniqueEmail('duplicate');
      const password = 'Test1234!';
      const organizationName = uniqueOrgName();

      // First registration should succeed
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

      // Second registration with same email should fail
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: uniqueOrgName(), // Different org
        })
        .expect(400);

      // Verify error response structure
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
      
      // Should not expose internal error details
      expect(response.body.message).not.toContain('SQL');
      expect(response.body.message).not.toContain('database');
    });

    it('should validate required fields', async () => {
      // Missing email
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      // Missing password
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: uniqueEmail(),
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      // Invalid email format
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'notanemail',
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });
  });

  /**
   * Login API Tests
   */
  describe('POST /auth/login', () => {
    beforeAll(async () => {
      // Create a test user for login tests
      testUser = {
        email: uniqueEmail('login'),
        password: 'Test1234!',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...testUser,
          firstName: 'Test',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect('Content-Type', /json/);

      // Verify response structure
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      
      // Store tokens for subsequent tests
      testUser.accessToken = response.body.accessToken;
      testUser.refreshToken = response.body.refreshToken;
      testUser.cookies = extractCookies(response);
      
      // Verify user data
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not login with invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
      
      // Should not expose whether email exists
      expect(response.body.message).not.toContain('email not found');
      expect(response.body.message).not.toContain('password incorrect');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test1234!',
        })
        .expect(401);

      // Error message should be same as wrong password (security)
      expect(response.body).toHaveProperty('statusCode', 401);
    });
  });

  /**
   * Protected Routes API Tests
   */
  describe('Protected Routes', () => {
    let protectedTestUser: typeof testUser;
    
    beforeAll(async () => {
      // Create and login a test user
      const email = uniqueEmail('protected');
      const password = 'Test1234!';

      // Register
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);

      // Login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      protectedTestUser = {
        email,
        password,
        accessToken: loginResponse.body.accessToken,
        refreshToken: loginResponse.body.refreshToken,
        cookies: extractCookies(loginResponse),
      };
    });

    it('should access protected route with Authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${protectedTestUser.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email', protectedTestUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should access protected route with cookies', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Cookie', formatCookiesForRequest(protectedTestUser.cookies!))
        .expect(200);

      expect(response.body).toHaveProperty('email', protectedTestUser.email);
    });

    it('should not access protected route without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
    });

    it('should not access protected route with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });
  });

  /**
   * Logout API Tests
   */
  describe('POST /auth/logout', () => {
    let logoutTestUser: typeof testUser;

    beforeAll(async () => {
      // Create fresh user for logout tests
      const email = uniqueEmail('logout');
      const password = 'Test1234!';

      // Register
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      logoutTestUser = {
        email,
        password,
        accessToken: loginResponse.body.accessToken,
        refreshToken: loginResponse.body.refreshToken,
        cookies: extractCookies(loginResponse),
      };
    });

    it('should logout successfully', async () => {
      // Logout request
      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${logoutTestUser.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      
      // Verify cookies are cleared
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Max-Age=0'),
        ])
      );

      // Verify token is no longer valid
      await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${logoutTestUser.accessToken}`)
        .expect(401);
    });

    it('should handle logout with cookies', async () => {
      // Login again to get fresh tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: logoutTestUser.email,
          password: logoutTestUser.password,
        })
        .expect(200);

      const cookies = extractCookies(loginResponse);

      // Logout using cookies
      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', formatCookiesForRequest(cookies))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });
});