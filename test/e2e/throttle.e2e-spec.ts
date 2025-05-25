import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';

describe('Throttling E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  describe('Login Endpoint Throttling', () => {
    it('should allow 5 login attempts within 15 minutes', async () => {
      const email = `throttle-test-${Date.now()}@example.com`;
      
      // Make 5 login attempts (should all pass)
      for (let i = 0; i < 5; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email, password: 'WrongPassword123!' });
        
        expect(res.status).toBe(401); // Wrong password, but not rate limited
      }
    });

    it('should block the 6th login attempt within 15 minutes', async () => {
      const email = `throttle-block-${Date.now()}@example.com`;
      
      // Make 5 login attempts
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email, password: 'WrongPassword123!' });
      }
      
      // 6th attempt should be rate limited
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'WrongPassword123!' });
      
      expect(res.status).toBe(429); // Too Many Requests
      expect(res.body.message).toMatch(/too many requests/i);
    });
  });

  describe('Registration Endpoint Throttling', () => {
    it('should allow 3 registration attempts per hour', async () => {
      // Make 3 registration attempts (should all pass)
      for (let i = 0; i < 3; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: `register-${Date.now()}-${i}@example.com`,
            password: 'Test1234!',
            firstName: 'Test',
            lastName: 'User',
            organizationName: 'TestOrg'
          });
        
        expect([200, 400]).toContain(res.status); // Success or validation error, but not rate limited
      }
    });

    it('should block the 4th registration attempt within an hour', async () => {
      // Make 3 registration attempts
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: `block-register-${Date.now()}-${i}@example.com`,
            password: 'Test1234!',
            firstName: 'Test',
            lastName: 'User',
            organizationName: 'TestOrg'
          });
      }
      
      // 4th attempt should be rate limited
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `block-register-${Date.now()}-final@example.com`,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg'
        });
      
      expect(res.status).toBe(429); // Too Many Requests
    });
  });

  describe('Password Reset Throttling', () => {
    it('should allow 3 password reset requests per hour', async () => {
      const baseEmail = `reset-${Date.now()}@example.com`;
      
      // Make 3 password reset requests (should all pass)
      for (let i = 0; i < 3; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/auth/forgot-password')
          .send({ email: baseEmail });
        
        expect(res.status).toBe(200); // Success, not rate limited
      }
    });

    it('should block the 4th password reset request within an hour', async () => {
      const baseEmail = `reset-block-${Date.now()}@example.com`;
      
      // Make 3 password reset requests
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/auth/forgot-password')
          .send({ email: baseEmail });
      }
      
      // 4th attempt should be rate limited
      const res = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: baseEmail });
      
      expect(res.status).toBe(429); // Too Many Requests
    });
  });

  describe('General API Throttling', () => {
    it('should allow 100 requests per minute for general endpoints', async () => {
      // Test with a public endpoint like health check
      const promises: Promise<request.Response>[] = [];
      
      // Make 100 requests (should all pass)
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app.getHttpServer())
            .get('/api/health')
        );
      }
      
      const responses = await Promise.all(promises);
      const successCount = responses.filter(res => res.status === 200).length;
      
      expect(successCount).toBe(100); // All should succeed
    });

    it('should rate limit after exceeding general API limit', async () => {
      // Make 100 requests first
      const promises: Promise<request.Response>[] = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app.getHttpServer())
            .get('/api/health')
        );
      }
      await Promise.all(promises);
      
      // 101st request should be rate limited
      const res = await request(app.getHttpServer())
        .get('/api/health');
      
      expect(res.status).toBe(429); // Too Many Requests
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include rate limit headers in responses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health');
      
      expect(res.headers).toHaveProperty('x-ratelimit-limit');
      expect(res.headers).toHaveProperty('x-ratelimit-remaining');
      expect(res.headers).toHaveProperty('x-ratelimit-reset');
    });
  });
}); 