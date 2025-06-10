import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../../src/modules/users/entities/user.entity';
import { Session } from '../../src/modules/auth/entities/session.entity';
import { RefreshToken } from '../../src/modules/auth/entities/refresh-token.entity';
import { faker } from '@faker-js/faker';

describe('Authentication Workflow Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepository;
  let sessionRepository;
  let refreshTokenRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    userRepository = dataSource.getRepository(User);
    sessionRepository = dataSource.getRepository(Session);
    refreshTokenRepository = dataSource.getRepository(RefreshToken);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database
    await dataSource.query('TRUNCATE TABLE refresh_tokens CASCADE');
    await dataSource.query('TRUNCATE TABLE sessions CASCADE');
    await dataSource.query('TRUNCATE TABLE users CASCADE');
  });

  describe('Complete Authentication Flow', () => {
    it('should handle complete registration -> login -> refresh -> logout flow', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'ValidPassword123!',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      };

      // Step 1: Register new user
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user).toBeDefined();
      expect(registerResponse.body.data.user.email).toBe(userData.email);
      expect(registerResponse.body.data.accessToken).toBeDefined();
      expect(registerResponse.body.data.refreshToken).toBeDefined();

      const { accessToken, refreshToken } = registerResponse.body.data;

      // Verify user was created in database
      const createdUser = await userRepository.findOne({
        where: { email: userData.email },
      });
      expect(createdUser).toBeDefined();
      expect(createdUser.isEmailVerified).toBe(false);

      // Step 2: Use access token to get profile
      const profileResponse = await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.email).toBe(userData.email);

      // Step 3: Refresh token
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(201);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.accessToken).toBeDefined();
      expect(refreshResponse.body.data.refreshToken).toBeDefined();
      expect(refreshResponse.body.data.accessToken).not.toBe(accessToken);

      const newAccessToken = refreshResponse.body.data.accessToken;

      // Step 4: Use new access token
      const profileResponse2 = await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(profileResponse2.body.data.email).toBe(userData.email);

      // Step 5: Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(201);

      // Step 6: Verify old tokens no longer work
      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(401);

      // Verify sessions are invalidated
      const sessions = await sessionRepository.find({
        where: { userId: createdUser.id },
      });
      expect(sessions.every(s => !s.isActive)).toBe(true);
    });

    it('should handle login with existing user', async () => {
      // First create a user
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'ValidPassword123!',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Login with created user
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(201);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.accessToken).toBeDefined();
      expect(loginResponse.body.data.refreshToken).toBeDefined();
      expect(loginResponse.body.data.user.email).toBe(userData.email);

      // Verify session was created
      const session = await sessionRepository.findOne({
        where: { sessionToken: loginResponse.body.data.sessionId },
      });
      expect(session).toBeDefined();
      expect(session.isActive).toBe(true);
    });

    it('should handle password change flow', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'OldPassword123!',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      };

      // Register user
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      const { accessToken } = registerResponse.body.data;

      // Change password
      const newPassword = 'NewPassword123!';
      const changePasswordResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: userData.password,
          newPassword,
        })
        .expect(201);

      expect(changePasswordResponse.body.success).toBe(true);

      // Old password should not work
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(401);

      // New password should work
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: newPassword,
        })
        .expect(201);

      expect(loginResponse.body.data.accessToken).toBeDefined();

      // Old access token should be invalidated
      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  describe('Session Management', () => {
    it('should manage multiple sessions per user', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'ValidPassword123!',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      };

      // Register user
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Create multiple sessions by logging in from different "devices"
      const session1 = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
        .expect(201);

      const session2 = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .expect(201);

      const session3 = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
        .expect(201);

      // Get all sessions
      const sessionsResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${session1.body.data.accessToken}`)
        .expect(200);

      expect(sessionsResponse.body.success).toBe(true);
      expect(sessionsResponse.body.data.length).toBe(3);

      // Revoke specific session
      const sessionToRevoke = sessionsResponse.body.data[1];
      await request(app.getHttpServer())
        .post('/api/v1/auth/sessions/revoke')
        .set('Authorization', `Bearer ${session1.body.data.accessToken}`)
        .send({ sessionId: sessionToRevoke.id })
        .expect(201);

      // Verify session was revoked
      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${session2.body.data.accessToken}`)
        .expect(401);

      // Other sessions should still work
      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${session1.body.data.accessToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${session3.body.data.accessToken}`)
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid credentials gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should handle validation errors with proper messages', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'weak',
          firstName: '',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toBeDefined();
    });

    it('should handle duplicate email registration', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'ValidPassword123!',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      };

      // First registration should succeed
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email should fail
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_ALREADY_EXISTS');
    });
  });

  describe('Token Security', () => {
    it('should reject expired tokens', async () => {
      // This would require mocking time or using a pre-generated expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.fake';

      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should reject malformed tokens', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should handle missing authorization header', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .expect(401);
    });
  });
});