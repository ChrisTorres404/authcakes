/**
 * @fileoverview Pure API-based E2E Tests for Basic Authentication Flows
 * 
 * These tests are designed to be completely independent of the application's
 * internal implementation. They only test the HTTP API contract and could
 * potentially be run against any deployment (local, staging, production).
 * 
 * No internal imports are used - only HTTP requests and responses.
 */

import * as request from 'supertest';

/**
 * Configuration for API tests
 * Can be overridden via environment variables for testing different environments
 */
const API_CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3030',
  apiPrefix: process.env.API_PREFIX || '/api',
};

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

/**
 * Pure API-based authentication tests
 * These tests treat the API as a black box and only test the HTTP contract
 */
describe('Auth API Basic E2E Tests', () => {
  const apiUrl = `${API_CONFIG.baseUrl}${API_CONFIG.apiPrefix}`;
  
  // Test data that will be shared across related tests
  let testUser: {
    email: string;
    password: string;
    accessToken?: string;
    refreshToken?: string;
    cookies?: Record<string, string>;
  };

  /**
   * Registration API Tests
   */
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const email = uniqueEmail('register');
      const password = 'Test1234!';
      const organizationName = uniqueOrgName();

      const response = await request(apiUrl)
        .post('/auth/register')
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
        emailVerified: true,
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
      await request(apiUrl)
        .post('/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName,
        })
        .expect(200);

      // Second registration with same email should fail
      const response = await request(apiUrl)
        .post('/auth/register')
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
      await request(apiUrl)
        .post('/auth/register')
        .send({
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      // Missing password
      await request(apiUrl)
        .post('/auth/register')
        .send({
          email: uniqueEmail(),
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      // Invalid email format
      await request(apiUrl)
        .post('/auth/register')
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

      await request(apiUrl)
        .post('/auth/register')
        .send({
          ...testUser,
          firstName: 'Test',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);
    });

    it('should login with valid credentials', async () => {
      const response = await request(apiUrl)
        .post('/auth/login')
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
      const response = await request(apiUrl)
        .post('/auth/login')
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
      const response = await request(apiUrl)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test1234!',
        })
        .expect(401);

      // Error message should be same as wrong password (security)
      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should implement rate limiting for failed logins', async () => {
      const bruteForceEmail = uniqueEmail('brute');
      const password = 'Test1234!';

      // Register user
      await request(apiUrl)
        .post('/auth/register')
        .send({
          email: bruteForceEmail,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);

      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await request(apiUrl)
          .post('/auth/login')
          .send({
            email: bruteForceEmail,
            password: 'WrongPassword!',
          })
          .expect(401);
      }

      // Next attempt should be locked
      const response = await request(apiUrl)
        .post('/auth/login')
        .send({
          email: bruteForceEmail,
          password, // Even with correct password
        })
        .expect(401);

      // Could check for specific lock message, but that might expose too much info
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
      await request(apiUrl)
        .post('/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);

      // Login to get tokens
      const loginResponse = await request(apiUrl)
        .post('/auth/login')
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
      console.log('Expected email:', protectedTestUser.email);
      console.log('Token being used:', protectedTestUser.accessToken);
      
      const response = await request(apiUrl)
        .get('/users/profile')
        .set('Authorization', `Bearer ${protectedTestUser.accessToken}`)
        .expect(200);

      console.log('Actual response:', response.body);
      
      expect(response.body).toHaveProperty('email', protectedTestUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should access protected route with cookies', async () => {
      const response = await request(apiUrl)
        .get('/users/profile')
        .set('Cookie', formatCookiesForRequest(protectedTestUser.cookies!))
        .expect(200);

      expect(response.body).toHaveProperty('email', protectedTestUser.email);
    });

    it('should not access protected route without authentication', async () => {
      const response = await request(apiUrl)
        .get('/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
    });

    it('should not access protected route with invalid token', async () => {
      const response = await request(apiUrl)
        .get('/users/profile')
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
      await request(apiUrl)
        .post('/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);

      // Login
      const loginResponse = await request(apiUrl)
        .post('/auth/login')
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
      const response = await request(apiUrl)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${logoutTestUser.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      
      // Verify cookies are cleared
      const cookies = extractCookies(response);
      // Cookies should be set with Max-Age=0 or expired dates
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Max-Age=0'),
        ])
      );

      // Verify token is no longer valid
      await request(apiUrl)
        .get('/users/profile')
        .set('Authorization', `Bearer ${logoutTestUser.accessToken}`)
        .expect(401);
    });

    it('should handle logout with cookies', async () => {
      // Login again to get fresh tokens
      const loginResponse = await request(apiUrl)
        .post('/auth/login')
        .send({
          email: logoutTestUser.email,
          password: logoutTestUser.password,
        })
        .expect(200);

      const cookies = extractCookies(loginResponse);

      // Logout using cookies
      const response = await request(apiUrl)
        .post('/auth/logout')
        .set('Cookie', formatCookiesForRequest(cookies))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  /**
   * Complete Authentication Flow Test
   */
  describe('Complete Authentication Flow', () => {
    it('should complete full auth flow: register, login, access protected route, and logout', async () => {
      const email = uniqueEmail('flow');
      const password = 'Test1234!';
      const organizationName = uniqueOrgName();

      // Step 1: Register
      const registerResponse = await request(apiUrl)
        .post('/auth/register')
        .send({
          email,
          password,
          firstName: 'Flow',
          lastName: 'Test',
          organizationName,
        })
        .expect(200);

      expect(registerResponse.body).toHaveProperty('accessToken');
      const registerToken = registerResponse.body.accessToken;

      // Step 2: Access protected route with registration token
      const profileResponse1 = await request(apiUrl)
        .get('/users/profile')
        .set('Authorization', `Bearer ${registerToken}`)
        .expect(200);

      expect(profileResponse1.body.email).toBe(email);

      // Step 3: Login
      const loginResponse = await request(apiUrl)
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      const loginToken = loginResponse.body.accessToken;

      // Step 4: Access protected route with login token
      const profileResponse2 = await request(apiUrl)
        .get('/users/profile')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      expect(profileResponse2.body.email).toBe(email);

      // Step 5: Logout
      await request(apiUrl)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      // Step 6: Verify token is invalidated
      await request(apiUrl)
        .get('/users/profile')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(401);
    });
  });

  /**
   * Error Response Format Tests
   */
  describe('Error Response Standards', () => {
    it('should return consistent error format for validation errors', async () => {
      const response = await request(apiUrl)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
        })
        .expect(400);

      // Verify standard error response structure
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
    });

    it('should not expose sensitive information in errors', async () => {
      const response = await request(apiUrl)
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password',
        })
        .expect(401);

      // Should not reveal if email exists or not
      expect(response.body.message).not.toMatch(/email.*not.*found/i);
      expect(response.body.message).not.toMatch(/user.*not.*exist/i);
      
      // Should not expose stack traces
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  /**
   * API Versioning and Headers Tests
   */
  describe('API Standards', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(apiUrl)
        .options('/auth/login')
        .expect(204);

      // CORS headers vary by origin - just check methods and headers
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });

    it('should include security headers', async () => {
      const response = await request(apiUrl)
        .get('/api')
        .expect(200);

      // Check that server identification headers are removed
      expect(response.headers).not.toHaveProperty('x-powered-by');
      expect(response.headers).not.toHaveProperty('server');

      // Check for essential security headers
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers).toHaveProperty('content-security-policy');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      expect(response.headers).toHaveProperty('referrer-policy');
      expect(response.headers).toHaveProperty('permissions-policy');

      // Check for enterprise security identifier
      expect(response.headers).toHaveProperty('x-security-level', 'enterprise');
      expect(response.headers).toHaveProperty('x-api-version');

      // Verify specific header values
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });
});