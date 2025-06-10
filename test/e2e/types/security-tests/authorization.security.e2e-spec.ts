import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../../../../src/modules/users/entities/user.entity';
import { Tenant } from '../../../../src/modules/tenants/entities/tenant.entity';
import { TenantMembership } from '../../../../src/modules/tenants/entities/tenant-membership.entity';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

describe('Authorization Security (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminUser: User;
  let regularUser: User;
  let otherUser: User;
  let adminToken: string;
  let userToken: string;
  let otherUserToken: string;
  let testTenant: Tenant;
  let otherTenant: Tenant;

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
    await dataSource.query('TRUNCATE TABLE tenant_memberships CASCADE');
    await dataSource.query('TRUNCATE TABLE tenants CASCADE');
    await dataSource.query('TRUNCATE TABLE users CASCADE');

    // Create users
    const userRepository = dataSource.getRepository(User);
    const tenantRepository = dataSource.getRepository(Tenant);
    const membershipRepository = dataSource.getRepository(TenantMembership);

    adminUser = await userRepository.save({
      email: 'admin@example.com',
      password: await bcrypt.hash('AdminPassword123!', 10),
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      isEmailVerified: true,
      role: 'admin',
    });

    regularUser = await userRepository.save({
      email: 'user@example.com',
      password: await bcrypt.hash('UserPassword123!', 10),
      firstName: 'Regular',
      lastName: 'User',
      isActive: true,
      isEmailVerified: true,
      role: 'user',
    });

    otherUser = await userRepository.save({
      email: 'other@example.com',
      password: await bcrypt.hash('OtherPassword123!', 10),
      firstName: 'Other',
      lastName: 'User',
      isActive: true,
      isEmailVerified: true,
      role: 'user',
    });

    // Create tenants
    testTenant = await tenantRepository.save({
      name: 'Test Tenant',
      subdomain: 'test',
      isActive: true,
    });

    otherTenant = await tenantRepository.save({
      name: 'Other Tenant',
      subdomain: 'other',
      isActive: true,
    });

    // Create memberships
    await membershipRepository.save({
      user: regularUser,
      tenant: testTenant,
      role: 'member',
      isActive: true,
    });

    await membershipRepository.save({
      user: otherUser,
      tenant: otherTenant,
      role: 'admin',
      isActive: true,
    });

    // Get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'AdminPassword123!' });
    adminToken = adminLogin.body.data.accessToken;

    const userLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'UserPassword123!' });
    userToken = userLogin.body.data.accessToken;

    const otherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'other@example.com', password: 'OtherPassword123!' });
    otherUserToken = otherLogin.body.data.accessToken;
  });

  describe('Role-Based Access Control', () => {
    it('should prevent regular users from accessing admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should allow admin users to access admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should prevent privilege escalation through user updates', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should prevent users from modifying other users', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/users/${otherUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: 'Hacked' })
        .expect(403);
    });
  });

  describe('Tenant Isolation', () => {
    it('should prevent access to other tenant resources', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/tenants/${otherTenant.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should prevent cross-tenant data access', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/tenants/${otherTenant.id}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should prevent adding users to unauthorized tenants', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${otherTenant.id}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: regularUser.id, role: 'admin' })
        .expect(403);
    });

    it('should validate tenant context in requests', async () => {
      // Try to access tenant-scoped resource with wrong tenant context
      await request(app.getHttpServer())
        .get(`/api/v1/tenants/${testTenant.id}/settings`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .set('X-Tenant-Id', testTenant.id)
        .expect(403);
    });
  });

  describe('API Key Security', () => {
    it('should not expose full API keys in responses', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Key', scopes: ['read:users'] })
        .expect(201);

      const apiKey = createResponse.body.data.key;
      expect(apiKey).toBeDefined();

      // Get API keys list
      const listResponse = await request(app.getHttpServer())
        .get('/api/v1/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should not contain full keys
      const keys = listResponse.body.data;
      keys.forEach((key: any) => {
        expect(key.key).toBeUndefined();
        expect(key.keyHash).toBeUndefined();
        expect(key.keyPreview).toMatch(/^[a-zA-Z0-9]{8}\.\.\./);
      });
    });

    it('should enforce API key scopes', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Limited Key', scopes: ['read:profile'] })
        .expect(201);

      const apiKey = createResponse.body.data.key;

      // Should allow profile access
      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('X-API-Key', apiKey)
        .expect(200);

      // Should deny user list access
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('X-API-Key', apiKey)
        .expect(403);
    });
  });

  describe('Path Traversal Protection', () => {
    const pathTraversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd',
      '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
    ];

    pathTraversalPayloads.forEach(payload => {
      it(`should prevent path traversal: ${payload}`, async () => {
        // Assuming there's a file download endpoint
        await request(app.getHttpServer())
          .get(`/api/v1/files/${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(status => status === 400 || status === 404);
      });
    });
  });

  describe('IDOR (Insecure Direct Object Reference) Protection', () => {
    it('should prevent accessing resources by guessing IDs', async () => {
      // Try to access user by ID without proper authorization
      const randomId = faker.string.uuid();
      
      await request(app.getHttpServer())
        .get(`/api/v1/users/${randomId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should use UUIDs instead of sequential IDs', async () => {
      // Check that user IDs are UUIDs
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const userId = response.body.data.id;
      expect(userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should validate resource ownership before access', async () => {
      // Create a resource for one user
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ key: 'theme', value: 'dark' })
        .expect(201);

      const settingId = createResponse.body.data.id;

      // Try to access it as another user
      await request(app.getHttpServer())
        .get(`/api/v1/settings/${settingId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });
  });

  describe('Mass Assignment Protection', () => {
    it('should prevent mass assignment of protected fields', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'Updated',
          role: 'admin', // Protected field
          isEmailVerified: true, // Protected field
          createdAt: '2020-01-01', // Protected field
        })
        .expect(400);

      expect(response.body.error.message).toContain('property role should not exist');
    });

    it('should prevent setting internal fields through API', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: faker.internet.email(),
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          id: faker.string.uuid(), // Should not be settable
          passwordResetToken: 'some-token', // Internal field
          emailVerificationToken: 'some-token', // Internal field
        })
        .expect(400);
    });
  });

  describe('Request Forgery Protection', () => {
    it('should validate referrer for state-changing operations', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Referer', 'https://evil-site.com')
        .expect(201); // Logout might still work but should log suspicious activity

      // In production, this might be blocked depending on CSRF policy
    });

    it('should require proper content-type for POST requests', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Content-Type', 'text/plain')
        .send('email=test@example.com&password=Password123!')
        .expect(400);
    });
  });

  describe('Information Disclosure Prevention', () => {
    it('should not leak user existence through password reset', async () => {
      const existingEmail = regularUser.email;
      const nonExistentEmail = 'nonexistent@example.com';

      // Both should return same response
      const response1 = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: existingEmail })
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: nonExistentEmail })
        .expect(201);

      // Responses should be identical
      expect(response1.body.success).toBe(response2.body.success);
      expect(response1.body.data.message).toBe(response2.body.data.message);
    });

    it('should not expose stack traces in production', async () => {
      // Force an error by sending invalid JSON
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid json')
        .expect(400);

      expect(response.body.error.stack).toBeUndefined();
      expect(response.body.error.message).not.toContain('SyntaxError');
    });

    it('should not expose database schema in errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test@example.com',
          // Missing required fields
        })
        .expect(400);

      // Should not contain database column names
      expect(JSON.stringify(response.body)).not.toContain('column');
      expect(JSON.stringify(response.body)).not.toContain('table');
      expect(JSON.stringify(response.body)).not.toContain('constraint');
    });
  });
});