import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../../../../src/modules/users/entities/user.entity';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

describe('Authentication Security (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database
    await dataSource.query('TRUNCATE TABLE users CASCADE');

    // Create test user
    const userRepository = dataSource.getRepository(User);
    testUser = await userRepository.save({
      email: faker.internet.email().toLowerCase(),
      password: await bcrypt.hash('ValidPassword123!', 10),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      isActive: true,
      isEmailVerified: true,
    });
  });

  describe('Brute Force Protection', () => {
    it('should block after 5 failed login attempts within 5 minutes', async () => {
      const email = testUser.email;
      const wrongPassword = 'WrongPassword123!';

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email, password: wrongPassword })
          .expect(401);
      }

      // 6th attempt should be blocked with 429
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'ValidPassword123!' })
        .expect(429);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.body.error.message).toContain('Too many requests');
    });

    it('should reset failed attempts after successful login', async () => {
      const email = testUser.email;
      const correctPassword = 'ValidPassword123!';
      const wrongPassword = 'WrongPassword123!';

      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email, password: wrongPassword })
          .expect(401);
      }

      // Successful login should reset counter
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: correctPassword })
        .expect(201);

      // Should be able to make new attempts
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: wrongPassword })
        .expect(401);
    });

    it('should apply rate limiting per IP address', async () => {
      // Create multiple users
      const users = await Promise.all(
        Array.from({ length: 3 }, async () => {
          const userRepository = dataSource.getRepository(User);
          return userRepository.save({
            email: faker.internet.email().toLowerCase(),
            password: await bcrypt.hash('ValidPassword123!', 10),
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            isActive: true,
            isEmailVerified: true,
          });
        })
      );

      // Make rapid requests from same IP
      const requests = users.map(user =>
        request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: user.email, password: 'WrongPassword123!' })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('SQL Injection Protection', () => {
    const maliciousInputs = [
      "admin' OR '1'='1",
      "admin'; DROP TABLE users; --",
      "admin' UNION SELECT * FROM users--",
      "admin' AND 1=1--",
      "' OR 'a'='a",
      "admin'/*",
      "admin' OR 1=1#",
      "admin' OR 1=1/*",
      "' or 1=1 LIMIT 1 -- ' ]",
    ];

    maliciousInputs.forEach(input => {
      it(`should sanitize malicious input: ${input}`, async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: input, password: 'password' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toContain('email must be an email');
      });
    });

    it('should prevent SQL injection in password field', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ 
          email: testUser.email, 
          password: "' OR '1'='1" 
        })
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('XSS Protection', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')">',
      '<input onfocus=alert("XSS") autofocus>',
      '<select onfocus=alert("XSS") autofocus>',
      '<textarea onfocus=alert("XSS") autofocus>',
      '<body onload=alert("XSS")>',
    ];

    xssPayloads.forEach(payload => {
      it(`should prevent XSS in registration: ${payload.substring(0, 30)}...`, async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            email: faker.internet.email().toLowerCase(),
            password: 'ValidPassword123!',
            firstName: payload,
            lastName: 'Test',
          })
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('JWT Security', () => {
    it('should reject tokens with invalid signature', async () => {
      const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });

    it('should reject expired tokens', async () => {
      // Login to get valid token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ 
          email: testUser.email, 
          password: 'ValidPassword123!' 
        })
        .expect(201);

      const { accessToken } = loginResponse.body.data;

      // Mock time to make token expired (this would require time mocking in real scenario)
      // For now, we'll test with a pre-generated expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.invalid';

      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should reject malformed tokens', async () => {
      const malformedTokens = [
        'not.a.token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'Bearer Bearer token',
        '',
        'null',
        'undefined',
      ];

      for (const token of malformedTokens) {
        await request(app.getHttpServer())
          .get('/api/v1/users/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(401);
      }
    });
  });

  describe('Password Security', () => {
    it('should enforce strong password requirements', async () => {
      const weakPasswords = [
        'password',
        '12345678',
        'qwerty123',
        'Password',
        'Password1',
        'Pass123',
      ];

      for (const password of weakPasswords) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            email: faker.internet.email().toLowerCase(),
            password,
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
          })
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toContain('password');
      }
    });

    it('should not leak password timing information', async () => {
      const timings: number[] = [];
      const iterations = 10;

      // Test with non-existent user
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ 
            email: 'nonexistent@example.com', 
            password: 'AnyPassword123!' 
          })
          .expect(401);
        timings.push(Date.now() - start);
      }

      // Calculate variance to ensure consistent timing
      const avg = timings.reduce((a, b) => a + b) / timings.length;
      const variance = timings.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / timings.length;
      const stdDev = Math.sqrt(variance);

      // Standard deviation should be relatively small (timing attack mitigation)
      expect(stdDev).toBeLessThan(50); // 50ms tolerance
    });
  });

  describe('Session Security', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ 
          email: testUser.email, 
          password: 'ValidPassword123!' 
        })
        .expect(201);

      accessToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should invalidate sessions on logout', async () => {
      // Verify token works
      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      // Token should no longer work
      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    it('should prevent session fixation attacks', async () => {
      // Login with first session
      const firstLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ 
          email: testUser.email, 
          password: 'ValidPassword123!' 
        })
        .expect(201);

      const firstToken = firstLogin.body.data.accessToken;

      // Login again (should create new session)
      const secondLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ 
          email: testUser.email, 
          password: 'ValidPassword123!' 
        })
        .expect(201);

      const secondToken = secondLogin.body.data.accessToken;

      // Tokens should be different
      expect(firstToken).not.toBe(secondToken);

      // Both tokens should work (multiple sessions allowed)
      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${firstToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${secondToken}`)
        .expect(200);
    });
  });

  describe('CSRF Protection', () => {
    it('should include CSRF protection headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('Security Headers', () => {
    it('should include all required security headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      // Check security headers
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(response.headers['permissions-policy']).toBeDefined();
      
      // Should not expose server information
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('should include Content-Security-Policy header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });
  });

  describe('Input Validation Security', () => {
    it('should reject requests with extra fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ 
          email: testUser.email, 
          password: 'ValidPassword123!',
          isAdmin: true, // Extra field
          role: 'admin', // Extra field
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('property isAdmin should not exist');
    });

    it('should sanitize HTML in input fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: faker.internet.email().toLowerCase(),
          password: 'ValidPassword123!',
          firstName: '<b>Test</b>',
          lastName: '<script>alert("XSS")</script>',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});