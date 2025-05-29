import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';

describe('Simple Throttling Test', () => {
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

  it('should throttle login endpoint after 5 attempts', async () => {
    const email = `throttle-${Date.now()}@example.com`;
    const results: Array<{ attempt: number; status: number; message: any }> =
      [];

    // Make 6 sequential login attempts
    for (let i = 0; i < 6; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'WrongPassword123!' });

      results.push({
        attempt: i + 1,
        status: res.status,
        message: res.body.message,
      });

      console.log(
        `Attempt ${i + 1}: Status ${res.status}, Message: ${res.body.message}`,
      );
    }

    // First 5 should be 401 (unauthorized)
    expect(results[0].status).toBe(401);
    expect(results[1].status).toBe(401);
    expect(results[2].status).toBe(401);
    expect(results[3].status).toBe(401);
    expect(results[4].status).toBe(401);

    // 6th should be 429 (too many requests)
    expect(results[5].status).toBe(429);
  });

  it('should not throttle health endpoint', async () => {
    // Make many requests to health endpoint
    for (let i = 0; i < 10; i++) {
      const res = await request(app.getHttpServer()).get('/api/health');

      expect(res.status).toBe(200);
    }
  });

  it('should throttle registration endpoint after 3 attempts', async () => {
    const results: Array<{ attempt: number; status: number }> = [];

    // Make 4 registration attempts
    for (let i = 0; i < 4; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `register-${Date.now()}-${i}@example.com`,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          organizationName: 'TestOrg',
        });

      results.push({
        attempt: i + 1,
        status: res.status,
      });

      console.log(`Registration attempt ${i + 1}: Status ${res.status}`);
    }

    // First 3 should be 200 or 400 (success or validation error)
    expect([200, 400]).toContain(results[0].status);
    expect([200, 400]).toContain(results[1].status);
    expect([200, 400]).toContain(results[2].status);

    // 4th should be 429 (too many requests)
    expect(results[3].status).toBe(429);
  });
});
