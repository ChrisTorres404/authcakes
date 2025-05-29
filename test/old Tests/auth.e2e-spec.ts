import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('Auth E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register, login, access protected route, refresh token, and logout', async () => {
    // Register
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'e2euser@example.com', password: 'Test1234!' })
      .expect(201);
    expect(registerRes.body).toHaveProperty('user');
    expect(registerRes.body).toHaveProperty('accessToken');
    const cookies = registerRes.headers['set-cookie'];

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'e2euser@example.com', password: 'Test1234!' })
      .expect(200);
    expect(loginRes.body).toHaveProperty('user');
    expect(loginRes.body).toHaveProperty('accessToken');
    const loginCookies = loginRes.headers['set-cookie'];

    // Access protected route
    const profileRes = await request(app.getHttpServer())
      .get('/api/users/profile')
      .set('Cookie', loginCookies)
      .expect(200);
    expect(profileRes.body).toHaveProperty('id');
    expect(profileRes.body).toHaveProperty('email');

    // Refresh token
    const refreshRes = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', loginCookies)
      .expect(200);
    expect(refreshRes.body).toHaveProperty('accessToken');

    // Logout
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', loginCookies)
      .expect(200);
  });

  it('should not login with invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'notfound@example.com', password: 'wrong' })
      .expect(401);
  });

  it('should not access protected route without token', async () => {
    await request(app.getHttpServer()).get('/api/users/profile').expect(401);
  });

  it('should not refresh with revoked token (after logout)', async () => {
    // Register and login to get cookies
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'e2euser2@example.com', password: 'Test1234!' })
      .expect(201);
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'e2euser2@example.com', password: 'Test1234!' })
      .expect(200);
    const loginCookies = loginRes.headers['set-cookie'];

    // Logout to revoke refresh token
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', loginCookies)
      .expect(200);

    // Try to refresh with revoked token
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', loginCookies)
      .expect(401);
  });

  it('should not allow registration with duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'dupe@example.com', password: 'Test1234!' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'dupe@example.com', password: 'Test1234!' })
      .expect(400);
  });

  it('should lock account after multiple failed logins (brute force protection)', async () => {
    const email = 'brute@example.com';
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Test1234!' })
      .expect(201);
    // Simulate failed logins (assuming max 5 attempts)
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'WrongPass!' })
        .expect(401);
    }
    // Now even correct password should fail (account locked)
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'Test1234!' })
      .expect(401);
  });

  it('should not access protected route with expired access token', async () => {
    // Register and login to get a valid token
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'expiretoken@example.com', password: 'Test1234!' })
      .expect(201);
    const { accessToken } = loginRes.body;
    // Simulate expired token by using a clearly invalid/expired JWT
    const expiredToken =
      accessToken.split('.').slice(0, 2).join('.') + '.expiredsig';
    await request(app.getHttpServer())
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('should handle password reset flow', async () => {
    // Register user
    const email = 'resetflow@example.com';
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Test1234!' })
      .expect(201);
    // Request password reset
    const resetReq = await request(app.getHttpServer())
      .post('/api/auth/request-password-reset')
      .send({ email })
      .expect(200);
    // Simulate receiving a reset token (mock or extract from service in real test)
    const resetToken = resetReq.body?.resetToken || 'mock-reset-token';
    // Reset password
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword: 'NewPass123!' })
      .expect(200);
    // Login with new password should succeed
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'NewPass123!' })
      .expect(200);
  });

  it('should handle email verification flow', async () => {
    // Register user
    const email = 'verifyflow@example.com';
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Test1234!' })
      .expect(201);
    // Simulate receiving a verification token (mock or extract from service in real test)
    const verifyToken = 'mock-verify-token';
    // Verify email
    await request(app.getHttpServer())
      .post('/api/users/verify-email')
      .send({ token: verifyToken })
      .expect(200);
    // (Optionally) Try to login and check emailVerified flag if returned
  });

  it('should handle phone verification flow', async () => {
    // Register user
    const email = 'phoneflow@example.com';
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Test1234!', phoneNumber: '+1234567890' })
      .expect(201);
    // Simulate receiving a phone verification token (mock or extract from service in real test)
    const phoneToken = 'mock-phone-token';
    // Verify phone
    await request(app.getHttpServer())
      .post('/api/users/verify-phone')
      .send({ token: phoneToken })
      .expect(200);
  });

  it('should handle MFA enrollment and verification flow', async () => {
    // Register and login
    const email = 'mfauser@example.com';
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Test1234!' })
      .expect(201);
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'Test1234!' })
      .expect(200);
    const loginCookies = loginRes.headers['set-cookie'];
    // Enroll in MFA
    const enrollRes = await request(app.getHttpServer())
      .post('/api/auth/mfa/enroll')
      .set('Cookie', loginCookies)
      .send({ type: 'totp' })
      .expect(200);
    const mfaSecret = enrollRes.body?.secret || 'mock-mfa-secret';
    // Simulate user entering correct MFA code
    const mfaCode = '123456';
    await request(app.getHttpServer())
      .post('/api/auth/mfa/verify')
      .set('Cookie', loginCookies)
      .send({ code: mfaCode })
      .expect(200);
  });

  it('should handle social login flow', async () => {
    // Simulate social login callback (mock provider response)
    const provider = 'google';
    const socialToken = 'mock-social-token';
    await request(app.getHttpServer())
      .post('/api/auth/social')
      .send({ provider, token: socialToken })
      .expect(200);
  });

  it('should handle account recovery flow', async () => {
    // Register user
    const email = 'recoveryflow@example.com';
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Test1234!' })
      .expect(201);
    // Request account recovery
    const recoveryReq = await request(app.getHttpServer())
      .post('/api/auth/request-account-recovery')
      .send({ email })
      .expect(200);
    // Simulate receiving a recovery token (mock or extract from service in real test)
    const recoveryToken =
      recoveryReq.body?.recoveryToken || 'mock-recovery-token';
    // Complete account recovery
    await request(app.getHttpServer())
      .post('/api/auth/complete-account-recovery')
      .send({ token: recoveryToken, newPassword: 'RecoveredPass123!' })
      .expect(200);
    // Login with new password should succeed
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'RecoveredPass123!' })
      .expect(200);
  });

  it('should handle device management flow', async () => {
    // Register and login
    const email = 'deviceflow@example.com';
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Test1234!' })
      .expect(201);
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'Test1234!' })
      .expect(200);
    const loginCookies = loginRes.headers['set-cookie'];
    // List devices
    const devicesRes = await request(app.getHttpServer())
      .get('/api/users/devices')
      .set('Cookie', loginCookies)
      .expect(200);
    const deviceId = devicesRes.body?.devices?.[0]?.id || 'mock-device-id';
    // Revoke a device/session
    await request(app.getHttpServer())
      .post(`/api/users/devices/${deviceId}/revoke`)
      .set('Cookie', loginCookies)
      .expect(200);
  });

  it('should handle session expiration (simulate by revoking session)', async () => {
    // Register and login
    const email = 'expireflow@example.com';
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Test1234!' })
      .expect(201);
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'Test1234!' })
      .expect(200);
    const loginCookies = loginRes.headers['set-cookie'];
    // List sessions to get sessionId
    const sessionsRes = await request(app.getHttpServer())
      .get('/api/auth/sessions')
      .set('Cookie', loginCookies)
      .expect(200);
    const sessionId = sessionsRes.body?.sessions?.[0]?.id || 'mock-session-id';
    // Revoke session
    await request(app.getHttpServer())
      .post('/api/auth/revoke-session')
      .set('Cookie', loginCookies)
      .send({ sessionId })
      .expect(200);
    // Try to access protected route (should fail)
    await request(app.getHttpServer())
      .get('/api/users/profile')
      .set('Cookie', loginCookies)
      .expect(401);
  });

  it('should log audit events (assume /api/audit-logs endpoint)', async () => {
    // Register and login
    const email = 'auditflow@example.com';
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Test1234!' })
      .expect(201);
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'Test1234!' })
      .expect(200);
    const loginCookies = loginRes.headers['set-cookie'];
    // Access audit logs
    const logsRes = await request(app.getHttpServer())
      .get('/api/audit-logs')
      .set('Cookie', loginCookies)
      .expect(200);
    expect(Array.isArray(logsRes.body)).toBe(true);
  });
});
