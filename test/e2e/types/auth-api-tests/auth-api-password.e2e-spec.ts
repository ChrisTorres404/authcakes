/**
 * @fileoverview API Password Management E2E Tests
 * 
 * AuthCakes API Integration Tests: Password Management
 * 
 * These tests simulate real-world API integration scenarios where frontend applications
 * or API clients integrate with AuthCakes for password management functionality.
 * 
 * API Features Tested:
 * - Password reset API flow (forgot → reset)
 * - Password change API with JWT authentication
 * - API error handling and validation
 * - Token-based authentication flows
 * - API response formats and status codes
 */

// Import test setup before any other imports to ensure environment is configured
import '../../test-setup';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../../../src/app.module';
import { DataSource } from 'typeorm';

/**
 * Extracts JWT token from API response headers or body
 */
function extractJWTToken(response: any): string {
  // Try to get from body first (API response)
  if (response.body?.accessToken) {
    return response.body.accessToken;
  }
  
  // Fallback to cookies if needed
  const cookies = response.headers['set-cookie'] as string[];
  if (cookies) {
    const accessTokenCookie = cookies.find(c => c.includes('access_token='));
    if (accessTokenCookie) {
      return accessTokenCookie.split('=')[1].split(';')[0];
    }
  }
  
  return '';
}

/**
 * Generates unique email for API test isolation
 */
function generateApiTestEmail(prefix = 'apiuser'): string {
  return `${prefix}+${Date.now()}@example.com`;
}

describe('AuthCakes API Password Management (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ 
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    
    await app.init();
    
    // Get database connection for direct queries when needed
    dataSource = moduleFixture.get<DataSource>(DataSource);
    
    // Clean database before tests
    await cleanDatabase();
  }, 30000);

  afterAll(async () => {
    await cleanDatabase();
    await dataSource.destroy();
    await app.close();
  }, 30000);

  beforeEach(async () => {
    // Clean database between tests for API isolation
    await cleanDatabase();
  });

  async function cleanDatabase() {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      const tables = [
        'password_history',
        'mfa_recovery_codes',
        'sessions',
        'refresh_tokens',
        'tenant_memberships',
        'tenants',
        'users',
        'logs',
      ];
      
      for (const table of tables) {
        await queryRunner.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
      }
    } finally {
      await queryRunner.release();
    }
  }

  describe('API Password Reset Flow', () => {
    it('should handle complete password reset API flow', async () => {
      const email = generateApiTestEmail('resetflow');
      const originalPassword = 'OriginalPass123!';
      const newPassword = 'NewSecurePass456!';
      const orgName = `ResetFlowOrg-${Date.now()}`;

      // Step 1: Register user via API
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: originalPassword,
          firstName: 'API',
          lastName: 'User',
          organizationName: orgName,
        })
        .expect(200);

      expect(registerResponse.body).toMatchObject({
        success: true,
        user: {
          email,
          firstName: 'API',
          lastName: 'User',
          role: 'user',
          active: true,
        },
      });

      // Step 2: Request password reset via API
      const forgotPasswordResponse = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);

      expect(forgotPasswordResponse.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset'),
      });

      // Step 3: Get reset token from database (simulates email delivery)
      const userResult = await dataSource.query(
        'SELECT "resetToken", "otp" FROM users WHERE email = $1',
        [email]
      );
      
      const resetToken = userResult[0].resetToken;
      const otp = userResult[0].otp;
      expect(resetToken).toBeTruthy();

      // Step 4: Reset password via API
      const resetPayload: any = {
        token: resetToken,
        password: newPassword,
      };

      // Include OTP if it exists (enterprise feature)
      if (otp) {
        resetPayload.otp = otp;
      }

      const resetResponse = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send(resetPayload)
        .expect(200);

      expect(resetResponse.body).toMatchObject({
        success: true,
        message: expect.stringContaining('password'),
      });

      // Step 5: Verify login with new password via API
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body).toMatchObject({
        user: {
          email,
          active: true,
        },
        accessToken: expect.any(String),
      });

      // Step 6: Verify old password no longer works
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email,
          password: originalPassword,
        })
        .expect(401);
    });

    it('should handle API validation errors for password reset', async () => {
      // Test invalid email format
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      // Test missing email
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);

      // Test invalid token
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'ValidPass123!',
        })
        .expect(400);

      // Test weak password
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: 'some-token',
          password: 'weak',
        })
        .expect(400);
    });

    it('should handle expired reset token via API', async () => {
      const email = generateApiTestEmail('expiredtoken');
      const password = 'TestPass123!';
      const orgName = `ExpiredTokenOrg-${Date.now()}`;

      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'Expired',
          lastName: 'Token',
          organizationName: orgName,
        })
        .expect(200);

      // Request password reset
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);

      // Get and manually expire the reset token
      const userResult = await dataSource.query(
        'SELECT id, "resetToken" FROM users WHERE email = $1',
        [email]
      );
      
      const userId = userResult[0].id;
      const resetToken = userResult[0].resetToken;

      // Expire the token
      await dataSource.query(
        'UPDATE users SET "resetTokenExpiry" = NOW() - INTERVAL \'1 hour\' WHERE id = $1',
        [userId]
      );

      // Try to reset with expired token
      const resetResponse = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPass123!',
        })
        .expect(400);

      expect(resetResponse.body).toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('expired'),
      });
    });
  });

  describe('API Password Change Flow', () => {
    it('should change password via authenticated API call', async () => {
      const email = generateApiTestEmail('changepass');
      const oldPassword = 'OldPass123!';
      const newPassword = 'NewPass456!';
      const orgName = `ChangePassOrg-${Date.now()}`;

      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: oldPassword,
          firstName: 'Change',
          lastName: 'Password',
          organizationName: orgName,
        })
        .expect(200);

      // Login to get JWT token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email,
          password: oldPassword,
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;
      expect(accessToken).toBeTruthy();

      // Change password using JWT authentication
      const changeResponse = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword,
          newPassword,
        })
        .expect(200);

      expect(changeResponse.body).toMatchObject({
        success: true,
        message: expect.stringContaining('password'),
      });

      // Wait for session invalidation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify old token is invalidated
      await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      // Login with new password
      const newLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email,
          password: newPassword,
        })
        .expect(200);

      expect(newLoginResponse.body).toMatchObject({
        user: {
          email,
        },
        accessToken: expect.any(String),
      });

      // Verify old password doesn't work
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email,
          password: oldPassword,
        })
        .expect(401);
    });

    it('should reject password change with invalid old password', async () => {
      const email = generateApiTestEmail('wrongoldpass');
      const correctPassword = 'CorrectPass123!';
      const wrongOldPassword = 'WrongOldPass123!';
      const newPassword = 'NewPass456!';
      const orgName = `WrongOldPassOrg-${Date.now()}`;

      // Register and login
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: correctPassword,
          firstName: 'Wrong',
          lastName: 'OldPass',
          organizationName: orgName,
        })
        .expect(200);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email,
          password: correctPassword,
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      // Try to change password with wrong old password
      const changeResponse = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: wrongOldPassword,
          newPassword,
        })
        .expect(401);

      expect(changeResponse.body).toMatchObject({
        statusCode: 401,
        message: expect.stringContaining('invalid'),
      });
    });

    it('should require authentication for password change API', async () => {
      // Try to change password without authentication
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .send({
          oldPassword: 'OldPass123!',
          newPassword: 'NewPass456!',
        })
        .expect(401);

      // Try with invalid token
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          oldPassword: 'OldPass123!',
          newPassword: 'NewPass456!',
        })
        .expect(401);
    });
  });

  describe('API Authentication and Authorization', () => {
    it('should provide proper JWT tokens in API responses', async () => {
      const email = generateApiTestEmail('jwttoken');
      const password = 'JWTPass123!';
      const orgName = `JWTOrg-${Date.now()}`;

      // Register user
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          firstName: 'JWT',
          lastName: 'User',
          organizationName: orgName,
        })
        .expect(200);

      // Verify JWT structure in registration response
      expect(registerResponse.body.accessToken).toBeTruthy();
      expect(registerResponse.body.accessToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

      // Login and verify JWT structure
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email,
          password,
        })
        .expect(200);

      expect(loginResponse.body.accessToken).toBeTruthy();
      expect(loginResponse.body.accessToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

      // Test authenticated API call
      const profileResponse = await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(200);

      expect(profileResponse.body).toMatchObject({
        email,
        firstName: 'JWT',
        lastName: 'User',
      });
    });

    it('should handle API rate limiting for password operations', async () => {
      const email = generateApiTestEmail('ratelimit');
      
      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/api/auth/forgot-password')
          .send({ email })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('API Error Handling and Validation', () => {
    it('should return consistent API error format', async () => {
      // Test validation error format
      const validationResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'weak',
        })
        .expect(400);

      expect(validationResponse.body).toMatchObject({
        statusCode: 400,
        message: expect.any(String),
      });

      // Test not found error format
      const notFoundResponse = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200); // Security: Don't reveal if email exists

      expect(notFoundResponse.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset'),
      });
    });

    it('should validate API input data properly', async () => {
      // Test missing required fields
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({})
        .expect(400);

      // Test invalid email format
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'ValidPass123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      // Test password requirements
      const weakPasswordResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      expect(weakPasswordResponse.body.message).toMatch(/password/i);
    });
  });

  describe('API Security Features', () => {
    it('should include security headers in API responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      // Check for security headers
      expect(response.headers).toMatchObject({
        'x-frame-options': expect.any(String),
        'x-content-type-options': expect.any(String),
      });
    });

    it('should handle CORS for API integration', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      // Accept either 204 (no content) or 200 (ok) for OPTIONS
      expect([200, 204]).toContain(response.status);

      // CORS headers should be present if enabled
      if (response.headers['access-control-allow-origin']) {
        expect(response.headers['access-control-allow-origin']).toBeTruthy();
        expect(response.headers['access-control-allow-methods']).toBeTruthy();
      }
    });

    it('should protect against common API attacks', async () => {
      // Test SQL injection attempt
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: "admin'--",
          password: 'password',
        })
        .expect(401);

      // Test XSS in API input
      const xssResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'xss@example.com',
          password: 'ValidPass123!',
          firstName: '<script>alert("xss")</script>',
          lastName: 'Test',
          organizationName: `XSSTestOrg-${Date.now()}`,
        })
        .expect(200);

      // Verify data is stored as provided (validation should prevent XSS at output level)
      expect(xssResponse.body.user.firstName).toBeDefined();
      expect(typeof xssResponse.body.user.firstName).toBe('string');
    });
  });
});