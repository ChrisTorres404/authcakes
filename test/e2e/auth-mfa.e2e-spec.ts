// auth-mfa.e2e-spec.ts
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

/**
 * Generates a unique email for tests
 */
function uniqueEmail(prefix = 'user') {
  return `${prefix}+${Date.now()}@example.com`;
}

describe('Auth MFA E2E', () => {
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
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  describe('MFA Enrollment and Verification', () => {
    it('should handle MFA enrollment and verification flow', async () => {
      // Register and login
      const email = uniqueEmail('mfauser');
      const password = 'Test1234!';
      
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ 
          email, 
          password, 
          firstName: 'Test', 
          lastName: 'User', 
          organizationName: 'TestOrg' 
        })
        .expect(200);
      
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);
      
      const loginCookies = loginRes.headers['set-cookie'];
      
      // Enroll in MFA
      const enrollRes = await request(app.getHttpServer())
        .post('/api/auth/mfa/enroll')
        .set('Cookie', loginCookies)
        .send({ type: 'totp' })
        .expect(200);
      
      expect(enrollRes.body).toHaveProperty('secret');
      
      // Simulate user entering correct MFA code
      const mfaCode = '123456'; // Mock code for testing
      
      await request(app.getHttpServer())
        .post('/api/auth/mfa/verify')
        .set('Cookie', loginCookies)
        .send({ code: mfaCode })
        .expect(200);
    });
  });
});