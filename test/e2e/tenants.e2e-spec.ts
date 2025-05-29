import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Tenants E2E', () => {
  let app: INestApplication;
  let tenantId: string;
  let membershipId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  it('should create a tenant', async () => {
    const res = await request(app.getHttpServer())
      .post('/tenants')
      .send({ name: 'Test Tenant', slug: 'test-tenant' })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    tenantId = res.body.id;
  });

  it('should add a user to tenant', async () => {
    // Replace with a real userId from your seeded data
    const userId = 'some-user-uuid';
    const res = await request(app.getHttpServer())
      .post(`/tenants/${tenantId}/members`)
      .send({ userId, role: 'admin' })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    membershipId = res.body.id;
  });

  it('should list tenant memberships', async () => {
    const res = await request(app.getHttpServer())
      .get(`/tenants/${tenantId}/members`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should update tenant membership role', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/tenants/members/${membershipId}`)
      .send({ role: 'member' })
      .expect(200);
    expect(res.body.role).toBe('member');
  });

  it('should remove user from tenant', async () => {
    await request(app.getHttpServer())
      .delete(`/tenants/${tenantId}/members/some-user-uuid`)
      .expect(200);
  });

  it('should allow only tenant members to access tenant-protected routes', async () => {
    // Create a tenant
    const tenantRes = await request(app.getHttpServer())
      .post('/api/tenants')
      .send({ name: 'TestTenant', slug: 'test-tenant' })
      .expect(201);
    const tenantId = tenantRes.body.data.id || tenantRes.body.data?.id;

    // Register and login a user
    const userEmail = 'tenantuser@example.com';
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: userEmail, password: 'Test1234!' })
      .expect(201);
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: userEmail, password: 'Test1234!' })
      .expect(200);
    const loginCookies = loginRes.headers['set-cookie'];
    const userId = loginRes.body.user.id;

    // Add user to tenant as admin
    await request(app.getHttpServer())
      .post(`/api/tenants/${tenantId}/members`)
      .set('Cookie', loginCookies)
      .send({ userId, role: 'admin' })
      .expect(201);

    // Access a tenant-protected route
    await request(app.getHttpServer())
      .get(`/api/tenants/${tenantId}/members`)
      .set('Cookie', loginCookies)
      .expect(200);

    // Try with a user not in the tenant
    const outsiderEmail = 'outsider@example.com';
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: outsiderEmail, password: 'Test1234!' })
      .expect(201);
    const outsiderLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: outsiderEmail, password: 'Test1234!' })
      .expect(200);
    const outsiderCookies = outsiderLogin.headers['set-cookie'];

    await request(app.getHttpServer())
      .get(`/api/tenants/${tenantId}/members`)
      .set('Cookie', outsiderCookies)
      .expect(403); // Forbidden
  });

  afterAll(async () => {
    await app.close();
  });
});
