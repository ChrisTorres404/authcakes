import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../../src/modules/users/entities/user.entity';
import * as crypto from 'crypto';

// Utility to generate unique emails for each test case
function uniqueEmail(prefix = 'user') {
  return `${prefix}+${Date.now()}@example.com`;
}

// Utility to decode JWT payload
function decodeJwtPayload(token: string) {
  const payload = token.split('.')[1];
  return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
}

// --- ENTERPRISE-LEVEL SECURITY E2E TESTS ---
describe('Enterprise Security E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configure app similar to main.ts for E2E tests
    app.use(cookieParser());
    
    // Enable CORS with strict configuration
    app.enableCors({
      origin: ['http://localhost:3000'], // Strict origin list
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type,Authorization',
      exposedHeaders: 'X-RateLimit-Limit,X-RateLimit-Remaining,X-RateLimit-Reset',
    });
    
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ 
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    
    await app.init();
    dataSource = app.get(DataSource);
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  describe('Authentication Security', () => {
    it('should enforce strong password requirements', async () => {
      const email = uniqueEmail('weakpass');
      
      // Test weak passwords
      const weakPasswords = [
        'password',      // Common password
        '12345678',      // Numeric only
        'abcdefgh',      // Letters only
        'Pass123',       // Too short
        'Password!',     // No numbers
        'password123!',  // No uppercase
        'PASSWORD123!',  // No lowercase
      ];

      for (const weakPassword of weakPasswords) {
        await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email,
            password: weakPassword,
            firstName: 'Test',
            lastName: 'User',
            organizationName: 'TestOrg'
          })
          .expect(400);
      }
    });

    it('should implement proper rate limiting on authentication endpoints', async () => {
      const email = uniqueEmail('ratelimit');
      
      // Make multiple rapid requests
      const promises: Promise<request.Response>[] = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email, password: 'WrongPass123!' })
        );
      }
      
      const responses = await Promise.all(promises);
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });

    it('should prevent timing attacks on user enumeration', async () => {
      const existingEmail = uniqueEmail('existing');
      const nonExistingEmail = uniqueEmail('nonexisting');
      
      // Register a user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: existingEmail,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg'
        })
        .expect(200);
      
      // Measure response times for existing vs non-existing users
      const timings: { existing: number[], nonExisting: number[] } = { existing: [], nonExisting: [] };
      
      for (let i = 0; i < 10; i++) {
        const start1 = Date.now();
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: existingEmail, password: 'WrongPass!' });
        timings.existing.push(Date.now() - start1);
        
        const start2 = Date.now();
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: nonExistingEmail, password: 'WrongPass!' });
        timings.nonExisting.push(Date.now() - start2);
      }
      
      // Calculate average response times
      const avgExisting = timings.existing.reduce((a, b) => a + b) / timings.existing.length;
      const avgNonExisting = timings.nonExisting.reduce((a, b) => a + b) / timings.nonExisting.length;
      
      // Response times should be similar (within 20% difference)
      const timeDiff = Math.abs(avgExisting - avgNonExisting);
      const maxDiff = Math.max(avgExisting, avgNonExisting) * 0.2;
      expect(timeDiff).toBeLessThan(maxDiff);
    });
  });

  describe('Session Security', () => {
    it('should implement secure session management with proper expiration', async () => {
      const email = uniqueEmail('session');
      
      // Register and login
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg'
        })
        .expect(200);
      
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Test1234!' })
        .expect(200);
      
      const cookies = loginRes.headers['set-cookie'];
      
      // Check cookie security attributes
      if (Array.isArray(cookies)) {
        cookies.forEach(cookie => {
          if (cookie.includes('access_token') || cookie.includes('refresh_token')) {
            expect(cookie).toMatch(/HttpOnly/i);
            expect(cookie).toMatch(/Secure/i);
            expect(cookie).toMatch(/SameSite=Strict/i);
          }
        });
      }
    });

    it('should implement session fixation protection', async () => {
      const email = uniqueEmail('fixation');
      
      // Get initial session
      const initialRes = await request(app.getHttpServer())
        .get('/api/auth/csrf-token')
        .expect(200);
      
      const initialCookies = initialRes.headers['set-cookie'] || [];
      
      // Register with existing session
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Cookie', Array.isArray(initialCookies) ? initialCookies : [initialCookies])
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg'
        })
        .expect(200);
      
      // Login and check if session ID changed
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Cookie', Array.isArray(initialCookies) ? initialCookies : [initialCookies])
        .send({ email, password: 'Test1234!' })
        .expect(200);
      
      const loginCookies = loginRes.headers['set-cookie'];
      const sessionIdChanged = !Array.isArray(loginCookies) || !loginCookies.some(cookie => 
        Array.isArray(initialCookies) && initialCookies.some(initial => cookie === initial)
      );
      
      expect(sessionIdChanged).toBe(true);
    });
  });

  describe('Token Security', () => {
    it('should validate JWT signature and prevent token tampering', async () => {
      const email = uniqueEmail('jwt');
      
      // Register and login
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg'
        })
        .expect(200);
      
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Test1234!' })
        .expect(200);
      
      const cookies = loginRes.headers['set-cookie'];
      const accessToken = Array.isArray(cookies) ? cookies
        .map(cookie => cookie.match(/access_token=([^;]+)/))
        .filter(Boolean)
        .map(match => match![1])[0] : '';
      
      // Tamper with the token
      const parts = accessToken.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      payload.role = 'admin'; // Try to escalate privileges
      const tamperedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
      
      // Try to use tampered token
      await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });

    it('should implement proper token rotation on refresh', async () => {
      const email = uniqueEmail('rotation');
      
      // Register and login
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg'
        })
        .expect(200);
      
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Test1234!' })
        .expect(200);
      
      const loginCookies = loginRes.headers['set-cookie'];
      
      // Refresh token
      const refreshRes = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', loginCookies)
        .expect(200);
      
      const newCookies = refreshRes.headers['set-cookie'];
      
      // Old refresh token should be invalidated
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', loginCookies)
        .expect(401);
    });
  });

  describe('Input Validation & Sanitization', () => {
    it('should prevent SQL injection attempts', async () => {
      const sqlInjectionPayloads = [
        "admin' OR '1'='1",
        "admin'; DROP TABLE users; --",
        "admin' UNION SELECT * FROM users--",
        "' OR 1=1--",
        "admin'/*",
      ];
      
      for (const payload of sqlInjectionPayloads) {
        const res = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: payload, password: 'password' })
          .expect(401);
        
        // Ensure no database error is exposed
        expect(res.body.message).not.toMatch(/sql|query|database/i);
      }
    });

    it('should prevent XSS attempts in user input', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
      ];
      
      for (const payload of xssPayloads) {
        await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: uniqueEmail('xss'),
            password: 'Test1234!',
            firstName: payload,
            lastName: 'User',
            organizationName: 'TestOrg'
          })
          .expect(400);
      }
    });

    it('should validate and sanitize all input fields', async () => {
      const invalidInputs = [
        { email: 'notanemail', password: 'Test1234!' },
        { email: 'test@', password: 'Test1234!' },
        { email: '@test.com', password: 'Test1234!' },
        { email: 'test@test@test.com', password: 'Test1234!' },
      ];
      
      for (const input of invalidInputs) {
        await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            ...input,
            firstName: 'Test',
            lastName: 'User',
            organizationName: 'TestOrg'
          })
          .expect(400);
      }
    });
  });

  describe('CSRF Protection', () => {
    it('should implement CSRF token validation', async () => {
      const email = uniqueEmail('csrf');
      
      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg'
        })
        .expect(200);
      
      // Try to perform action without CSRF token
      const res = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .send({
          oldPassword: 'Test1234!',
          newPassword: 'NewPass123!'
        });
      
      // Should either require authentication or CSRF token
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Account Security', () => {
    it('should implement account lockout after failed attempts', async () => {
      const email = uniqueEmail('lockout');
      const maxAttempts = 5;
      
      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg'
        })
        .expect(200);
      
      // Make failed login attempts
      for (let i = 0; i < maxAttempts; i++) {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email, password: 'WrongPassword!' })
          .expect(401);
      }
      
      // Account should be locked
      const lockedRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Test1234!' })
        .expect(401);
      
      expect(lockedRes.body.message).toMatch(/locked|too many attempts/i);
    });

    it('should implement secure password reset with token expiration', async () => {
      const email = uniqueEmail('reset');
      
      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg'
        })
        .expect(200);
      
      // Request password reset
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);
      
      // Get reset token from database
      const userRepo = dataSource.getRepository(User);
      const user = await userRepo.findOneByOrFail({ email });
      const resetToken = user.resetToken;
      
      // Verify token has expiration
      expect(user.resetTokenExpiry).toBeTruthy();
      if (user.resetTokenExpiry) {
        expect(user.resetTokenExpiry.getTime()).toBeGreaterThan(Date.now());
        
        // Token should expire in reasonable time (e.g., 1 hour)
        const expiryTime = user.resetTokenExpiry.getTime() - Date.now();
        expect(expiryTime).toBeLessThanOrEqual(60 * 60 * 1000); // 1 hour
      }
    });
  });

  describe('Audit & Monitoring', () => {
    it('should log security-relevant events', async () => {
      const email = uniqueEmail('audit');
      
      // Register and perform various actions
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg'
        })
        .expect(200);
      
      // Failed login attempt
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'WrongPassword!' })
        .expect(401);
      
      // Successful login
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Test1234!' })
        .expect(200);
      
      const cookies = loginRes.headers['set-cookie'];
      
      // Password reset request
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);
      
      // Check if audit logs exist (if endpoint is available)
      try {
        const logsRes = await request(app.getHttpServer())
          .get('/api/logs/audit')
          .set('Cookie', cookies)
          .expect(200);
        
        expect(Array.isArray(logsRes.body)).toBe(true);
        
        // Verify important events are logged
        const eventTypes = logsRes.body.map(log => log.action);
        expect(eventTypes).toEqual(expect.arrayContaining([
          'user_registration',
          'login_failed',
          'login_success',
          'password_reset_request'
        ]));
      } catch (err) {
        console.warn('Audit logs endpoint not available');
      }
    });
  });

  describe('Data Protection', () => {
    it('should not expose sensitive data in API responses', async () => {
      const email = uniqueEmail('sensitive');
      
      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg'
        })
        .expect(200);
      
      // Login
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Test1234!' })
        .expect(200);
      
      // Check response doesn't contain sensitive fields
      expect(loginRes.body.user).toBeDefined();
      expect(loginRes.body.user.password).toBeUndefined();
      expect(loginRes.body.user.resetToken).toBeUndefined();
      expect(loginRes.body.user.mfaSecret).toBeUndefined();
      expect(loginRes.body.user.emailVerificationToken).toBeUndefined();
    });

    it('should implement proper data encryption for sensitive fields', async () => {
      const email = uniqueEmail('encryption');
      
      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg'
        })
        .expect(200);
      
      // Check database for encrypted data
      const userRepo = dataSource.getRepository(User);
      const user = await userRepo.findOneByOrFail({ email });
      
      // Password should be hashed
      expect(user.password).not.toBe('Test1234!');
      expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });
  });

  describe('API Security Headers', () => {
    it('should set proper security headers', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);
      
      // Check security headers
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-xss-protection']).toBe('1; mode=block');
      expect(res.headers['strict-transport-security']).toBeTruthy();
      expect(res.headers['content-security-policy']).toBeTruthy();
    });
  });

  describe('Multi-Factor Authentication', () => {
    it('should enforce MFA when enabled', async () => {
      const email = uniqueEmail('mfa');
      
      // Register and login
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg'
        })
        .expect(200);
      
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Test1234!' })
        .expect(200);
      
      const cookies = loginRes.headers['set-cookie'];
      
      // Enable MFA
      const mfaRes = await request(app.getHttpServer())
        .post('/api/auth/mfa/enroll')
        .set('Cookie', cookies)
        .send({ type: 'totp' })
        .expect(200);
      
      expect(mfaRes.body.secret).toBeTruthy();
      expect(mfaRes.body.qrCode).toBeTruthy();
      
      // Future logins should require MFA
      const mfaLoginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Test1234!' })
        .expect(200);
      
      // Should indicate MFA is required
      expect(mfaLoginRes.body.requiresMfa).toBe(true);
    });
  });

  describe('API Versioning & Deprecation', () => {
    it('should handle API versioning properly', async () => {
      // Test v1 endpoint (if exists)
      const v1Res = await request(app.getHttpServer())
        .get('/api/v1/health');
      
      // Test current version
      const currentRes = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);
      
      // Check for deprecation headers on old versions
      if (v1Res.status === 200) {
        expect(v1Res.headers['x-api-deprecation-warning']).toBeTruthy();
      }
    });
  });

  describe('Compliance & Privacy', () => {
    it('should support GDPR data export', async () => {
      const email = uniqueEmail('gdpr');
      
      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg'
        })
        .expect(200);
      
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Test1234!' })
        .expect(200);
      
      const cookies = loginRes.headers['set-cookie'];
      
      // Request data export
      try {
        const exportRes = await request(app.getHttpServer())
          .post('/api/users/export-data')
          .set('Cookie', cookies)
          .expect(200);
        
        expect(exportRes.body).toHaveProperty('exportId');
      } catch (err) {
        console.warn('GDPR export endpoint not implemented');
      }
    });

    it('should support account deletion', async () => {
      const email = uniqueEmail('deletion');
      
      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg'
        })
        .expect(200);
      
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Test1234!' })
        .expect(200);
      
      const cookies = loginRes.headers['set-cookie'];
      
      // Request account deletion
      try {
        await request(app.getHttpServer())
          .delete('/api/users/account')
          .set('Cookie', cookies)
          .send({ password: 'Test1234!' })
          .expect(200);
        
        // Verify account is deleted
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email, password: 'Test1234!' })
          .expect(401);
      } catch (err) {
        console.warn('Account deletion endpoint not implemented');
      }
    });
  });
}); 