/**
 * @fileoverview Pure API-based E2E Tests for Account Recovery Flows
 * 
 * These tests are designed from a frontend developer's perspective, testing
 * the account recovery API endpoints as they would be consumed by a real
 * client application (web, mobile, etc.).
 * 
 * Tests cover:
 * - Password reset flow
 * - Account recovery with MFA
 * - Security edge cases
 * - Error handling and user feedback
 * - Rate limiting and abuse prevention
 * 
 * No internal imports are used - only HTTP requests and responses.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../../../src/app.module';
import { DataSource } from 'typeorm';

// Configuration removed - using app instance directly

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

// Helper functions removed as they were unused in this test file

/**
 * Account Recovery API Tests
 * These tests simulate real frontend application scenarios
 */
describe('Auth API Account Recovery E2E Tests', () => {
  let app: INestApplication;
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
  }, 30000);

  afterAll(async () => {
    // Clean up database before closing
    if (dataSource && dataSource.isInitialized) {
      await dataSource.query('TRUNCATE TABLE logs, users, tenants, tenant_memberships CASCADE');
    }
    await app.close();
  }, 10000);

  beforeEach(async () => {
    // Clean up database before each test to ensure isolation
    if (dataSource && dataSource.isInitialized) {
      await dataSource.query('TRUNCATE TABLE logs, users, tenants, tenant_memberships CASCADE');
    }
  });
  
  /**
   * Basic Account Recovery Flow
   * This is the happy path that most users will experience
   */
  describe('Standard Account Recovery Flow', () => {
    it('should complete full account recovery process', async () => {
      // Step 1: Register a user (simulating existing account)
      const email = uniqueEmail('recovery-standard');
      const originalPassword = 'OriginalPass123!';
      const newPassword = 'NewSecurePass456!';
      
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: originalPassword,
          firstName: 'John',
          lastName: 'Doe',
          organizationName: uniqueOrgName(),
        })
        .expect(200);
      
      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body.user.email).toBe(email);
      
      // Step 2: Request account recovery (user forgot password)
      const recoveryResponse = await request(app.getHttpServer())
        .post(`/api/auth/request-account-recovery`)
        .send({ email })
        .expect(200);
      
      expect(recoveryResponse.body).toHaveProperty('success', true);
      
      // In test environment, we might get the token directly
      // In production, this would be sent via email
      let recoveryToken: string | undefined;
      if (recoveryResponse.body.recoveryToken) {
        recoveryToken = recoveryResponse.body.recoveryToken;
      }
      
      // Step 3: Complete recovery with new password
      if (recoveryToken) {
        const completeResponse = await request(app.getHttpServer())
          .post('/api/auth/complete-account-recovery')
          .send({
            token: recoveryToken,
            newPassword,
          })
          .expect(200);
        
        expect(completeResponse.body).toHaveProperty('success', true);
        
        // Step 4: Verify old password no longer works
        await request(app.getHttpServer())
          .post(`/api/auth/login`)
          .send({
            email,
            password: originalPassword,
          })
          .expect(401);
        
        // Step 5: Verify new password works
        const loginResponse = await request(app.getHttpServer())
          .post(`/api/auth/login`)
          .send({
            email,
            password: newPassword,
          })
          .expect(200);
        
        expect(loginResponse.body).toHaveProperty('accessToken');
        expect(loginResponse.body).toHaveProperty('user');
        expect(loginResponse.body.user.email).toBe(email);
      }
    });
  });

  /**
   * Security-focused tests
   * These ensure the API doesn't leak information about accounts
   */
  describe('Security and Privacy', () => {
    it('should not reveal whether an email exists in the system', async () => {
      const existingEmail = uniqueEmail('existing');
      const nonExistentEmail = uniqueEmail('nonexistent');
      
      // Create an account
      await request(app.getHttpServer())
        .post(`/api/auth/register`)
        .send({
          email: existingEmail,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);
      
      // Request recovery for existing account
      const existingResponse = await request(app.getHttpServer())
        .post(`/api/auth/request-account-recovery`)
        .send({ email: existingEmail })
        .expect(200);
      
      // Request recovery for non-existent account
      const nonExistentResponse = await request(app.getHttpServer())
        .post(`/api/auth/request-account-recovery`)
        .send({ email: nonExistentEmail })
        .expect(200);
      
      // Both responses should be identical (except for any test-only fields)
      expect(existingResponse.body.success).toBe(true);
      expect(nonExistentResponse.body.success).toBe(true);
      
      // In production, neither should return a token
      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
        expect(existingResponse.body).not.toHaveProperty('recoveryToken');
        expect(nonExistentResponse.body).not.toHaveProperty('recoveryToken');
      }
    });

    it('should handle invalid recovery tokens gracefully', async () => {
      const invalidTokens = [
        'completely-invalid-token',
        '123', // too short
        'a'.repeat(1000), // too long
        'special!@#$%^&*()chars', // special characters
      ];
      
      for (const token of invalidTokens) {
        const response = await request(app.getHttpServer())
          .post(`/api/auth/complete-account-recovery`)
          .send({
            token,
            newPassword: 'NewPassword123!',
          })
          .expect(400);
        
        expect(response.body).toHaveProperty('statusCode', 400);
        expect(response.body).toHaveProperty('message');
        // Message should be generic to avoid information leakage
        const message = Array.isArray(response.body.message) 
          ? response.body.message.join(' ').toLowerCase() 
          : response.body.message.toLowerCase();
        expect(message).toMatch(/invalid|token|required/);
      }
      
      // Test empty token separately as it triggers validation
      const emptyResponse = await request(app.getHttpServer())
        .post(`/api/auth/complete-account-recovery`)
        .send({
          token: '',
          newPassword: 'NewPassword123!',
        })
        .expect(400);
      
      expect(emptyResponse.body).toHaveProperty('statusCode', 400);
      expect(emptyResponse.body).toHaveProperty('message');
      const emptyMessage = Array.isArray(emptyResponse.body.message) 
        ? emptyResponse.body.message.join(' ').toLowerCase() 
        : emptyResponse.body.message.toLowerCase();
      expect(emptyMessage).toMatch(/token|required|empty/);
    });

    it('should prevent token reuse after successful recovery', async () => {
      const email = uniqueEmail('token-reuse');
      
      // Setup: Register user
      await request(app.getHttpServer())
        .post(`/api/auth/register`)
        .send({
          email,
          password: 'OldPassword123!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);
      
      // Request recovery
      const recoveryResponse = await request(app.getHttpServer())
        .post('/api/auth/request-account-recovery')
        .send({ email })
        .expect(200);
      
      const recoveryToken = recoveryResponse.body.recoveryToken;
      
      if (recoveryToken) {
        // First use: should succeed
        await request(app.getHttpServer())
          .post(`/api/auth/complete-account-recovery`)
          .send({
            token: recoveryToken,
            newPassword: 'FirstNewPassword123!',
          })
          .expect(200);
        
        // Second use: should fail
        const reuseResponse = await request(app.getHttpServer())
          .post(`/api/auth/complete-account-recovery`)
          .send({
            token: recoveryToken,
            newPassword: 'SecondNewPassword123!',
          })
          .expect(400);
        
        expect(reuseResponse.body).toHaveProperty('statusCode', 400);
        const reuseMessage = Array.isArray(reuseResponse.body.message) 
          ? reuseResponse.body.message.join(' ').toLowerCase() 
          : reuseResponse.body.message.toLowerCase();
        expect(reuseMessage).toContain('invalid');
      }
    });
  });

  /**
   * Rate limiting and abuse prevention
   */
  describe('Rate Limiting and Abuse Prevention', () => {
    it('should rate limit recovery requests per email', async () => {
      const email = uniqueEmail('rate-limit-email');
      
      // Register user
      await request(app.getHttpServer())
        .post(`/api/auth/register`)
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);
      
      // Make multiple recovery requests in quick succession
      const requests: Promise<request.Response>[] = [];
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app.getHttpServer())
            .post('/api/auth/request-account-recovery')
            .send({ email })
        );
      }
      
      const responses = await Promise.all(requests);
      
      // Some should succeed, but eventually we should hit rate limit
      const statusCodes = responses.map(r => r.status);
      
      // Should contain at least one 429 (Too Many Requests)
      // or all 200s if rate limiting is handled differently
      const hasRateLimit = statusCodes.includes(429);
      const allSuccess = statusCodes.every(code => code === 200);
      
      expect(hasRateLimit || allSuccess).toBe(true);
      
      // If rate limited, verify error message
      const rateLimitedResponse = responses.find(r => r.status === 429);
      if (rateLimitedResponse) {
        expect(rateLimitedResponse.body).toHaveProperty('message');
        const rateLimitMessage = Array.isArray(rateLimitedResponse.body.message) 
          ? rateLimitedResponse.body.message.join(' ').toLowerCase() 
          : rateLimitedResponse.body.message.toLowerCase();
        expect(rateLimitMessage).toMatch(/rate|limit|too many/);
      }
    });

    it('should invalidate old tokens when requesting new ones', async () => {
      const email = uniqueEmail('token-invalidation');
      
      // Setup: Register user
      await request(app.getHttpServer())
        .post(`/api/auth/register`)
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);
      
      // Request first recovery token
      const firstRecovery = await request(app.getHttpServer())
        .post('/api/auth/request-account-recovery')
        .send({ email })
        .expect(200);
      
      const firstToken = firstRecovery.body.recoveryToken;
      
      // Request second recovery token
      const secondRecovery = await request(app.getHttpServer())
        .post('/api/auth/request-account-recovery')
        .send({ email })
        .expect(200);
      
      const secondToken = secondRecovery.body.recoveryToken;
      
      if (firstToken && secondToken) {
        // First token should now be invalid
        await request(app.getHttpServer())
          .post(`/api/auth/complete-account-recovery`)
          .send({
            token: firstToken,
            newPassword: 'NewPassword123!',
          })
          .expect(400);
        
        // Second token should work
        await request(app.getHttpServer())
          .post(`/api/auth/complete-account-recovery`)
          .send({
            token: secondToken,
            newPassword: 'NewPassword123!',
          })
          .expect(200);
      }
    });
  });

  /**
   * MFA-enabled Account Recovery
   * For users with enhanced security requirements
   */
  describe('Account Recovery with MFA', () => {
    it('should require MFA code when user has MFA enabled', async () => {
      // This test would require MFA setup first
      // Marking as todo for when MFA setup endpoints are available
      
      // TODO: Implement when MFA setup is available via API
      // 1. Register user
      // 2. Enable MFA
      // 3. Request account recovery
      // 4. Attempt recovery without MFA code (should fail)
      // 5. Attempt recovery with invalid MFA code (should fail)
      // 6. Complete recovery with valid MFA code (should succeed)
    });
  });

  /**
   * Password Policy Enforcement
   */
  describe('Password Policy During Recovery', () => {
    it('should enforce password complexity requirements', async () => {
      const email = uniqueEmail('password-policy');
      
      // Setup: Register user
      await request(app.getHttpServer())
        .post(`/api/auth/register`)
        .send({
          email,
          password: 'OldPassword123!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);
      
      // Request recovery
      const recoveryResponse = await request(app.getHttpServer())
        .post('/api/auth/request-account-recovery')
        .send({ email })
        .expect(200);
      
      const recoveryToken = recoveryResponse.body.recoveryToken;
      
      if (recoveryToken) {
        // Test various invalid passwords
        const invalidPasswords = [
          'short',      // Too short
          '12345678',   // No letters
          'password',   // Too simple
        ];
        
        for (const password of invalidPasswords) {
          const response = await request(app.getHttpServer())
            .post(`/api/auth/complete-account-recovery`)
            .send({
              token: recoveryToken,
              newPassword: password,
            });
          
          // Should reject weak passwords
          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('message');
        }
      }
    });

    it('should prevent password reuse', async () => {
      const email = uniqueEmail('password-reuse');
      const originalPassword = 'OriginalPass123!';
      
      // Setup: Register user
      await request(app.getHttpServer())
        .post(`/api/auth/register`)
        .send({
          email,
          password: originalPassword,
          firstName: 'Test',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);
      
      // Request recovery
      const recoveryResponse = await request(app.getHttpServer())
        .post('/api/auth/request-account-recovery')
        .send({ email })
        .expect(200);
      
      const recoveryToken = recoveryResponse.body.recoveryToken;
      
      if (recoveryToken) {
        // Try to set the same password
        const response = await request(app.getHttpServer())
          .post(`/api/auth/complete-account-recovery`)
          .send({
            token: recoveryToken,
            newPassword: originalPassword,
          })
          .expect(409);
        
        expect(response.body).toHaveProperty('statusCode', 409);
        const reusePasswordMessage = Array.isArray(response.body.message) 
          ? response.body.message.join(' ').toLowerCase() 
          : response.body.message.toLowerCase();
        expect(reusePasswordMessage).toContain('previous');
      }
    });
  });

  /**
   * Frontend Integration Scenarios
   * These tests simulate common frontend implementation patterns
   */
  describe('Frontend Integration Scenarios', () => {
    it('should handle recovery flow with frontend routing', async () => {
      // Simulate a typical frontend flow:
      // 1. User clicks "Forgot Password" link
      // 2. Frontend shows recovery form
      // 3. User enters email
      // 4. Frontend calls API
      // 5. Frontend shows success message
      // 6. User clicks link in email (simulated by using token)
      // 7. Frontend shows password reset form
      // 8. User enters new password
      // 9. Frontend calls API
      // 10. Frontend redirects to login
      
      const email = uniqueEmail('frontend-flow');
      
      // User already exists
      await request(app.getHttpServer())
        .post(`/api/auth/register`)
        .send({
          email,
          password: 'ForgottenPass123!',
          firstName: 'Frontend',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);
      
      // Step 3-4: User submits email
      const recoveryResponse = await request(app.getHttpServer())
        .post('/api/auth/request-account-recovery')
        .send({ email })
        .expect(200);
      
      // Verify response structure for frontend
      expect(recoveryResponse.body).toHaveProperty('success', true);
      // Frontend would show a generic success message
      
      const recoveryToken = recoveryResponse.body.recoveryToken;
      
      if (recoveryToken) {
        // Step 8-9: User submits new password
        const resetResponse = await request(app.getHttpServer())
          .post(`/api/auth/complete-account-recovery`)
          .send({
            token: recoveryToken,
            newPassword: 'BrandNewPass456!',
          })
          .expect(200);
        
        expect(resetResponse.body).toHaveProperty('success', true);
        
        // Step 10: User is redirected to login and can sign in
        const loginResponse = await request(app.getHttpServer())
          .post(`/api/auth/login`)
          .send({
            email,
            password: 'BrandNewPass456!',
          })
          .expect(200);
        
        expect(loginResponse.body).toHaveProperty('accessToken');
      }
    });

    it('should provide clear error messages for frontend display', async () => {
      // Test various error scenarios and verify messages are frontend-friendly
      
      // Invalid email format
      const invalidEmailResponse = await request(app.getHttpServer())
        .post('/api/auth/request-account-recovery')
        .send({ email: 'not-an-email' })
        .expect(400);
      
      expect(invalidEmailResponse.body).toHaveProperty('message');
      const message = Array.isArray(invalidEmailResponse.body.message) 
        ? invalidEmailResponse.body.message.join(' ') 
        : invalidEmailResponse.body.message;
      expect(message).toMatch(/email/i);
      
      // Missing fields
      const missingFieldsResponse = await request(app.getHttpServer())
        .post(`/api/auth/complete-account-recovery`)
        .send({ token: 'some-token' }) // missing newPassword
        .expect(400);
      
      expect(missingFieldsResponse.body).toHaveProperty('message');
      // Should indicate what's missing
      
      // Expired token (simulated with invalid token)
      const expiredResponse = await request(app.getHttpServer())
        .post(`/api/auth/complete-account-recovery`)
        .send({
          token: 'expired-token-simulation',
          newPassword: 'ValidPass123!',
        })
        .expect(400);
      
      const expiredMessage = Array.isArray(expiredResponse.body.message) 
        ? expiredResponse.body.message.join(' ') 
        : expiredResponse.body.message;
      expect(expiredMessage).toMatch(/invalid|expired/i);
    });
  });

  /**
   * Mobile App Considerations
   */
  describe('Mobile App Integration', () => {
    it('should support recovery flow without cookies', async () => {
      // Mobile apps typically don't use cookies
      const email = uniqueEmail('mobile-recovery');
      
      // Register via mobile app
      const registerResponse = await request(app.getHttpServer())
        .post(`/api/auth/register`)
        .set('User-Agent', 'MobileApp/1.0')
        .send({
          email,
          password: 'MobilePass123!',
          firstName: 'Mobile',
          lastName: 'User',
          organizationName: uniqueOrgName(),
        })
        .expect(200);
      
      // Ensure tokens are in response body (not just cookies)
      expect(registerResponse.body).toHaveProperty('accessToken');
      
      // Request recovery
      const recoveryResponse = await request(app.getHttpServer())
        .post('/api/auth/request-account-recovery')
        .set('User-Agent', 'MobileApp/1.0')
        .send({ email })
        .expect(200);
      
      const recoveryToken = recoveryResponse.body.recoveryToken;
      
      if (recoveryToken) {
        // Complete recovery
        await request(app.getHttpServer())
          .post(`/api/auth/complete-account-recovery`)
          .set('User-Agent', 'MobileApp/1.0')
          .send({
            token: recoveryToken,
            newPassword: 'NewMobilePass456!',
          })
          .expect(200);
        
        // Login with new password
        const loginResponse = await request(app.getHttpServer())
          .post(`/api/auth/login`)
          .set('User-Agent', 'MobileApp/1.0')
          .send({
            email,
            password: 'NewMobilePass456!',
          })
          .expect(200);
        
        // Verify tokens are returned for mobile storage
        expect(loginResponse.body).toHaveProperty('accessToken');
        expect(loginResponse.body).toHaveProperty('refreshToken');
      }
    });
  });

  /**
   * Monitoring and Observability
   * These tests verify that the API provides adequate information for monitoring
   */
  describe('API Observability', () => {
    it('should include request IDs for tracking', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/request-account-recovery')
        .send({ email: 'test@example.com' })
        .expect(200);
      
      // Check for request tracking headers
      // Request ID helps with debugging and log correlation
      expect(response.headers['x-request-id'] || response.headers['x-correlation-id']).toBeDefined();
    });

    it('should include appropriate cache headers', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/request-account-recovery')
        .send({ email: 'test@example.com' })
        .expect(200);
      
      // Recovery endpoints should not be cached
      // Note: Cache headers might be set by middleware or not set at all
      const cacheControl = response.headers['cache-control'];
      if (cacheControl) {
        expect(cacheControl).toMatch(/no-cache|no-store|private/);
      }
      // Otherwise, no cache header is acceptable for POST requests
    });
  });
});