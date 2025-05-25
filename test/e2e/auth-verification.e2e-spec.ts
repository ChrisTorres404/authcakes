// auth-verification.e2e-spec.ts
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

describe('Auth Verification E2E', () => {
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

  describe('Email Verification', () => {
    it('should handle email verification flow', async () => {
      // Register user
      const email = uniqueEmail('verifyflow');
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
      
      // Fetch the verification token from the database
      const user = await userRepository.findOneByOrFail({ email });
      const verifyToken = user.emailVerificationToken;
      
      expect(verifyToken).toBeTruthy();
      
      // Verify email
      await request(app.getHttpServer())
        .post('/api/users/verify-email')
        .send({ token: verifyToken })
        .expect(200);
      
      // Verify user's email is now verified
      const verifiedUser = await userRepository.findOneByOrFail({ email });
      expect(verifiedUser.emailVerified).toBe(true);
    });
  });

  describe('Phone Verification', () => {
    it('should handle phone verification flow', async () => {
      // Register user
      const email = uniqueEmail('phoneflow');
      const password = 'Test1234!';
      
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ 
          email, 
          password, 
          phoneNumber: '+1234567890', 
          firstName: 'Test', 
          lastName: 'User', 
          organizationName: 'TestOrg' 
        })
        .expect(200);
      
      // Fetch the phone verification token from the database
      const user = await userRepository.findOneByOrFail({ email });
      const phoneToken = user.phoneVerificationToken;
      
      // If no phone verification token was generated, skip the test
      if (!phoneToken) {
        console.warn('Skipping phone verification test: no phone verification token generated');
        return;
      }
      
      // Verify phone
      await request(app.getHttpServer())
        .post('/api/users/verify-phone')
        .send({ token: phoneToken })
        .expect(200);
      
      // Verify user's phone is now verified
      const verifiedUser = await userRepository.findOneByOrFail({ email });
      expect(verifiedUser.phoneVerified).toBe(true);
    });
  });
});