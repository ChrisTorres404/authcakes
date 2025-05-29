import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/modules/auth/services/auth.service';
import { UsersService } from '../../src/modules/users/services/users.service';
import { Connection, Repository } from 'typeorm';
import { User } from '../../src/modules/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * E2E Tests for Account Recovery Edge Cases
 *
 * Tests the following scenarios:
 * 1. Attempting recovery with an expired token (should fail)
 * 2. Attempting recovery with an invalid token (should fail)
 * 3. Attempting to reuse a recovery token after it's already been used (should fail)
 * 4. Multiple recovery requests in a row (should respect rate limiting and invalidate previous tokens)
 * 5. Attempting recovery without MFA code when MFA is enabled (should fail)
 */
describe('Account Recovery Edge Cases (E2E)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let connection: Connection;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    connection = moduleFixture.get<Connection>(Connection);
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Testing token expiration and invalidity', () => {
    let testUser: User | null;
    let recoveryToken: string;

    beforeAll(async () => {
      // Create a test user
      const email = `recovery-expire-test-${Date.now()}@example.com`;
      const password = 'StrongPass123!';

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password })
        .expect(201);

      testUser = await usersService.findByEmail(email);
      expect(testUser).not.toBeNull();

      // Request account recovery to get a token
      const recoveryReq = await request(app.getHttpServer())
        .post('/api/auth/request-account-recovery')
        .send({ email })
        .expect(200);

      // In test environment, token should be returned
      recoveryToken = recoveryReq.body?.recoveryToken;
    });

    it('should reject recovery with an expired token', async () => {
      // Force token expiration by directly modifying the database
      if (testUser) {
        // Set expiry to a past date
        await userRepository.update(
          { id: testUser.id },
          { accountRecoveryTokenExpiry: new Date(Date.now() - 3600000) }, // 1 hour ago
        );

        // Attempt to use the expired token
        await request(app.getHttpServer())
          .post('/api/auth/complete-account-recovery')
          .send({
            token: recoveryToken,
            newPassword: 'NewPassword123!',
          })
          .expect(400); // Should fail with Bad Request
      }
    });

    it('should reject recovery with an invalid token', async () => {
      // Try with a completely invalid token
      await request(app.getHttpServer())
        .post('/api/auth/complete-account-recovery')
        .send({
          token: 'totally-invalid-token-that-doesnt-exist',
          newPassword: 'NewPassword123!',
        })
        .expect(400); // Should fail with Bad Request
    });
  });

  describe('Testing token reuse', () => {
    let testUser: User | null;
    let recoveryToken: string;

    beforeAll(async () => {
      // Create a test user
      const email = `recovery-reuse-test-${Date.now()}@example.com`;
      const password = 'StrongPass123!';

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password })
        .expect(201);

      testUser = await usersService.findByEmail(email);
      expect(testUser).not.toBeNull();

      // Request account recovery to get a token
      const recoveryReq = await request(app.getHttpServer())
        .post('/api/auth/request-account-recovery')
        .send({ email })
        .expect(200);

      // In test environment, token should be returned
      recoveryToken = recoveryReq.body?.recoveryToken;
    });

    it('should not allow reuse of a recovery token after successful use', async () => {
      // First use should succeed
      await request(app.getHttpServer())
        .post('/api/auth/complete-account-recovery')
        .send({
          token: recoveryToken,
          newPassword: 'NewPassword456!',
        })
        .expect(200);

      // Second use should fail
      await request(app.getHttpServer())
        .post('/api/auth/complete-account-recovery')
        .send({
          token: recoveryToken,
          newPassword: 'YetAnotherPassword789!',
        })
        .expect(400); // Should fail with Bad Request
    });
  });

  describe('Testing multiple recovery requests', () => {
    let testUser: User | null;
    let firstToken: string;

    beforeAll(async () => {
      // Create a test user
      const email = `recovery-multiple-test-${Date.now()}@example.com`;
      const password = 'StrongPass123!';

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password })
        .expect(201);

      testUser = await usersService.findByEmail(email);
      expect(testUser).not.toBeNull();

      // Request first account recovery token
      const firstRecoveryReq = await request(app.getHttpServer())
        .post('/api/auth/request-account-recovery')
        .send({ email })
        .expect(200);

      // In test environment, token should be returned
      firstToken = firstRecoveryReq.body?.recoveryToken;
    });

    it('should invalidate previous tokens when requesting a new one', async () => {
      const email = testUser?.email;
      expect(email).toBeDefined();

      // Request a second recovery token
      const secondRecoveryReq = await request(app.getHttpServer())
        .post('/api/auth/request-account-recovery')
        .send({ email })
        .expect(200);

      const secondToken = secondRecoveryReq.body?.recoveryToken;

      // Try to use the first token (should fail as it's now invalid)
      await request(app.getHttpServer())
        .post('/api/auth/complete-account-recovery')
        .send({
          token: firstToken,
          newPassword: 'ShouldNotWork123!',
        })
        .expect(400); // Should fail with Bad Request

      // Second token should still work
      await request(app.getHttpServer())
        .post('/api/auth/complete-account-recovery')
        .send({
          token: secondToken,
          newPassword: 'ShouldWork123!',
        })
        .expect(200);
    });
  });

  describe('Testing MFA requirement for account recovery', () => {
    let testUser: User | null;
    let recoveryToken: string;

    beforeAll(async () => {
      // Create a test user
      const email = `recovery-mfa-test-${Date.now()}@example.com`;
      const password = 'StrongPass123!';

      // Register user
      const registerRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password })
        .expect(201);

      const cookies = registerRes.headers['set-cookie'];

      // Get user
      testUser = await usersService.findByEmail(email);
      expect(testUser).not.toBeNull();

      if (testUser) {
        // Enable MFA for the user (directly in the database for simplicity)
        await userRepository.update(
          { id: testUser.id },
          {
            mfaEnabled: true,
            mfaType: 'totp',
            mfaSecret: 'test-mfa-secret',
          },
        );

        // Request account recovery
        const recoveryReq = await request(app.getHttpServer())
          .post('/api/auth/request-account-recovery')
          .send({ email })
          .expect(200);

        recoveryToken = recoveryReq.body?.recoveryToken;
      } else {
        throw new Error('Test user not created properly');
      }
    });

    it('should require MFA code for account recovery when MFA is enabled', async () => {
      // Attempt recovery without MFA code
      await request(app.getHttpServer())
        .post('/api/auth/complete-account-recovery')
        .send({
          token: recoveryToken,
          newPassword: 'NewPassword789!',
        })
        .expect(400); // Should fail - missing MFA code

      // Attempt with invalid MFA code
      await request(app.getHttpServer())
        .post('/api/auth/complete-account-recovery')
        .send({
          token: recoveryToken,
          newPassword: 'NewPassword789!',
          mfaCode: '123456', // Invalid code
        })
        .expect(401); // Should fail - invalid MFA code
    });
  });

  describe('Testing recovery for non-existent accounts', () => {
    it('should not reveal whether an account exists during recovery request', async () => {
      const nonExistentEmail = `nonexistent-${Date.now()}@example.com`;

      // Request recovery for non-existent account
      const response = await request(app.getHttpServer())
        .post('/api/auth/request-account-recovery')
        .send({ email: nonExistentEmail })
        .expect(200); // Should still return 200 OK

      // Response should not include a recoveryToken for non-existent accounts
      expect(response.body).not.toHaveProperty('recoveryToken');
    });
  });
});
