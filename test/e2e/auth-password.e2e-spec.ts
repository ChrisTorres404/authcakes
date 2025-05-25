// auth-password.e2e-spec.ts
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

describe('Auth Password Management E2E', () => {
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

  describe('Password Reset Flow', () => {
    it('should handle password reset flow (happy path)', async () => {
      // Register user
      const email = uniqueEmail('resetflow');
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
      
      // Request password reset
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);
      
      // Fetch the reset token from the database
      const user = await userRepository.findOneByOrFail({ email });
      const resetToken = user.resetToken;
      const otp = user.otp; // Fetch the OTP
      
      expect(resetToken).toBeTruthy();
      
      // Happy path: Reset password with valid token and OTP if available
      const resetPayload = { 
        token: resetToken, 
        password: 'NewPass123!' 
      };
      
      // Add OTP if it exists
      if (otp) {
        resetPayload['otp'] = otp;
      }
      
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send(resetPayload)
        .expect(200);
      
      // Login with new password should succeed
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'NewPass123!' })
        .expect(200);
    });

    it('should not reset password with expired token (sad path)', async () => {
      // Register user
      const email = uniqueEmail('resetexpired');
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
      
      // Request password reset
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);
      
      // Fetch the reset token from the database
      const user = await userRepository.findOneByOrFail({ email });
      const resetToken = user.resetToken;
      
      // Manually expire the token
      await userRepository.update(user.id, { 
        resetTokenExpiry: new Date(Date.now() - 1000) 
      });
      
      // Try to reset password with expired token
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: resetToken, password: 'NewPass123!' })
        .expect(400);
    });

    it('should not reset password with invalid token (sad path)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: 'invalidtoken', password: 'NewPass123!' })
        .expect(400);
    });

    it('should not reset password for deactivated account (sad path)', async () => {
      // Register user
      const email = uniqueEmail('resetdeactivated');
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
      
      // Deactivate user
      const user = await userRepository.findOneByOrFail({ email });
      await userRepository.update(user.id, { active: false });
      
      // Request password reset
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);
      
      // Fetch the reset token from the database
      const deactivatedUser = await userRepository.findOneByOrFail({ email });
      const resetToken = deactivatedUser.resetToken;
      
      // Try to reset password for deactivated account
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: resetToken, password: 'NewPass123!' })
        .expect(400);
    });

    it('should not reset password for locked account (sad path)', async () => {
      // Register user
      const email = uniqueEmail('resetlocked');
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
      
      // Lock user
      const user = await userRepository.findOneByOrFail({ email });
      await userRepository.update(user.id, { 
        lockedUntil: new Date(Date.now() + 60 * 60 * 1000) // lock for 1 hour
      });
      
      // Request password reset
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);
      
      // Fetch the reset token from the database
      const lockedUser = await userRepository.findOneByOrFail({ email });
      const resetToken = lockedUser.resetToken;
      
      // Try to reset password for locked account
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: resetToken, password: 'NewPass123!' })
        .expect(400);
    });
  });

  describe('Password Change', () => {
    it('should change password successfully', async () => {
      // Register and login
      const email = uniqueEmail('changepass');
      const password = 'Test1234!';
      const newPassword = 'Changed123!';
      
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
      
      // Change password
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Cookie', loginCookies)
        .send({ oldPassword: password, newPassword: newPassword })
        .expect(200);

      // Wait for session revocation to complete
      await new Promise(res => setTimeout(res, 100));

      // Debug: Fetch and log all sessions for the user after password change
      const userAfterChange = await userRepository.findOneByOrFail({ email });
      const sessions = await dataSource.getRepository('Session').find({ where: { user: { id: userAfterChange.id } } });
      // eslint-disable-next-line no-console
      console.log('Sessions after password change:', sessions);
      // eslint-disable-next-line no-console
      console.log('Session cookie used for profile request:', loginCookies);

      // Try to use old session/token (should be revoked)
      await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Cookie', loginCookies)
        .expect(401);
      
      // Login with new password should succeed
      const userBeforeNewLogin = await userRepository.findOneByOrFail({ email });
      // eslint-disable-next-line no-console
      console.log('User before new login:', userBeforeNewLogin);
      const newLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: newPassword })
        .expect(200);
      expect(newLogin.body).toHaveProperty('accessToken');
    });

    it('should not change password with incorrect old password', async () => {
      // Register and login
      const email = uniqueEmail('changepasswrong');
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
      
      // Try to change password with wrong old password
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Cookie', loginCookies)
        .send({ oldPassword: 'WrongOldPassword!', newPassword: 'NewPassword123!' })
        .expect(401);
    });

    it('should not change password without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .send({ oldPassword: 'Test1234!', newPassword: 'NewPassword123!' })
        .expect(401);
    });
  });
});