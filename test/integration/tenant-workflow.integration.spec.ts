import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../../src/modules/users/entities/user.entity';
import { Tenant } from '../../src/modules/tenants/entities/tenant.entity';
import { TenantMembership } from '../../src/modules/tenants/entities/tenant-membership.entity';
import { TenantInvitation } from '../../src/modules/tenants/entities/tenant-invitation.entity';
import { faker } from '@faker-js/faker';

describe('Tenant Workflow Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepository;
  let tenantRepository;
  let membershipRepository;
  let invitationRepository;

  // Test users
  let adminUser: User;
  let adminToken: string;
  let regularUser: User;
  let regularToken: string;
  let otherUser: User;
  let otherToken: string;

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
    tenantRepository = dataSource.getRepository(Tenant);
    membershipRepository = dataSource.getRepository(TenantMembership);
    invitationRepository = dataSource.getRepository(TenantInvitation);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database
    await dataSource.query('TRUNCATE TABLE tenant_invitations CASCADE');
    await dataSource.query('TRUNCATE TABLE tenant_memberships CASCADE');
    await dataSource.query('TRUNCATE TABLE tenants CASCADE');
    await dataSource.query('TRUNCATE TABLE users CASCADE');

    // Create test users
    const adminData = {
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      firstName: 'Admin',
      lastName: 'User',
    };

    const regularData = {
      email: 'user@example.com',
      password: 'UserPassword123!',
      firstName: 'Regular',
      lastName: 'User',
    };

    const otherData = {
      email: 'other@example.com',
      password: 'OtherPassword123!',
      firstName: 'Other',
      lastName: 'User',
    };

    // Register users and get tokens
    const adminResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(adminData);
    adminUser = await userRepository.findOne({ where: { email: adminData.email } });
    adminToken = adminResponse.body.data.accessToken;

    const regularResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(regularData);
    regularUser = await userRepository.findOne({ where: { email: regularData.email } });
    regularToken = regularResponse.body.data.accessToken;

    const otherResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(otherData);
    otherUser = await userRepository.findOne({ where: { email: otherData.email } });
    otherToken = otherResponse.body.data.accessToken;

    // Make admin user a system admin
    adminUser.role = 'admin';
    await userRepository.save(adminUser);
  });

  describe('Complete Tenant Lifecycle', () => {
    it('should handle tenant creation, member management, and deletion', async () => {
      // Step 1: Create tenant as admin
      const tenantData = {
        name: 'Test Company',
        slug: 'test-company',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(tenantData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.name).toBe(tenantData.name);
      expect(createResponse.body.data.slug).toBe(tenantData.slug);
      
      const tenantId = createResponse.body.data.id;

      // Verify admin is automatically owner
      const membership = await membershipRepository.findOne({
        where: { tenantId, userId: adminUser.id },
      });
      expect(membership).toBeDefined();
      expect(membership.role).toBe('owner');

      // Step 2: Add member to tenant
      const addMemberResponse = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: regularUser.id,
          role: 'member',
        })
        .expect(201);

      expect(addMemberResponse.body.success).toBe(true);

      // Step 3: List tenant members
      const membersResponse = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(membersResponse.body.success).toBe(true);
      expect(membersResponse.body.data.length).toBe(2);

      // Step 4: Update member role
      await request(app.getHttpServer())
        .patch(`/api/v1/tenants/${tenantId}/members/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(200);

      // Verify role was updated
      const updatedMembership = await membershipRepository.findOne({
        where: { tenantId, userId: regularUser.id },
      });
      expect(updatedMembership.role).toBe('admin');

      // Step 5: Regular user (now admin) can access tenant
      const tenantResponse = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(tenantResponse.body.data.id).toBe(tenantId);

      // Step 6: Remove member
      await request(app.getHttpServer())
        .delete(`/api/v1/tenants/${tenantId}/members/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify member was removed
      await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      // Step 7: Delete tenant
      await request(app.getHttpServer())
        .delete(`/api/v1/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify tenant was deleted
      const deletedTenant = await tenantRepository.findOne({
        where: { id: tenantId },
      });
      expect(deletedTenant).toBeNull();
    });
  });

  describe('Tenant Invitations', () => {
    let tenantId: string;

    beforeEach(async () => {
      // Create a tenant for invitation tests
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invitation Test Company',
          slug: 'invitation-test',
        });
      
      tenantId = createResponse.body.data.id;
    });

    it('should handle invitation flow for existing users', async () => {
      // Step 1: Create invitation
      const inviteResponse = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantId}/invitations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: otherUser.email,
          role: 'member',
        })
        .expect(201);

      expect(inviteResponse.body.success).toBe(true);
      expect(inviteResponse.body.data.email).toBe(otherUser.email);
      expect(inviteResponse.body.data.token).toBeDefined();

      const invitationToken = inviteResponse.body.data.token;

      // Step 2: List pending invitations
      const invitationsResponse = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantId}/invitations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(invitationsResponse.body.data.length).toBe(1);

      // Step 3: Accept invitation
      const acceptResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/accept-invitation')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ token: invitationToken })
        .expect(201);

      expect(acceptResponse.body.success).toBe(true);

      // Step 4: Verify user is now a member
      const membership = await membershipRepository.findOne({
        where: { tenantId, userId: otherUser.id },
      });
      expect(membership).toBeDefined();
      expect(membership.role).toBe('member');

      // User can now access tenant
      await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);
    });

    it('should handle invitation flow for new users', async () => {
      const newUserEmail = faker.internet.email().toLowerCase();

      // Step 1: Create invitation for non-existent user
      const inviteResponse = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantId}/invitations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: newUserEmail,
          role: 'member',
        })
        .expect(201);

      const invitationToken = inviteResponse.body.data.token;

      // Step 2: New user registers
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: newUserEmail,
          password: 'NewUserPassword123!',
          firstName: 'New',
          lastName: 'User',
        })
        .expect(201);

      const newUserToken = registerResponse.body.data.accessToken;

      // Step 3: Accept invitation
      await request(app.getHttpServer())
        .post('/api/v1/auth/accept-invitation')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ token: invitationToken })
        .expect(201);

      // Step 4: Verify membership
      const newUser = await userRepository.findOne({ where: { email: newUserEmail } });
      const membership = await membershipRepository.findOne({
        where: { tenantId, userId: newUser.id },
      });
      expect(membership).toBeDefined();
    });

    it('should prevent duplicate invitations', async () => {
      // First invitation
      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantId}/invitations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: otherUser.email,
          role: 'member',
        })
        .expect(201);

      // Duplicate invitation should fail
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantId}/invitations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: otherUser.email,
          role: 'member',
        })
        .expect(409);

      expect(response.body.error.code).toBe('INVITATION_ALREADY_EXISTS');
    });

    it('should cancel invitations', async () => {
      // Create invitation
      const inviteResponse = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantId}/invitations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: otherUser.email,
          role: 'member',
        })
        .expect(201);

      const invitationId = inviteResponse.body.data.id;

      // Cancel invitation
      await request(app.getHttpServer())
        .delete(`/api/v1/tenants/${tenantId}/invitations/${invitationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify invitation was cancelled
      const invitation = await invitationRepository.findOne({
        where: { id: invitationId },
      });
      expect(invitation).toBeNull();
    });
  });

  describe('Tenant Access Control', () => {
    let tenant1Id: string;
    let tenant2Id: string;

    beforeEach(async () => {
      // Create two separate tenants
      const tenant1Response = await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tenant One',
          slug: 'tenant-one',
        });
      tenant1Id = tenant1Response.body.data.id;

      const tenant2Response = await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tenant Two',
          slug: 'tenant-two',
        });
      tenant2Id = tenant2Response.body.data.id;

      // Add regular user to tenant1 only
      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenant1Id}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: regularUser.id,
          role: 'member',
        });
    });

    it('should enforce tenant isolation', async () => {
      // Regular user can access tenant1
      await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenant1Id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      // Regular user cannot access tenant2
      await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenant2Id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      // Regular user cannot add members to tenant2
      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenant2Id}/members`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          userId: otherUser.id,
          role: 'member',
        })
        .expect(403);
    });

    it('should enforce role-based permissions within tenant', async () => {
      // Regular user (member) cannot add new members
      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenant1Id}/members`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          userId: otherUser.id,
          role: 'member',
        })
        .expect(403);

      // Upgrade regular user to admin
      await request(app.getHttpServer())
        .patch(`/api/v1/tenants/${tenant1Id}/members/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(200);

      // Now regular user (admin) can add members
      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenant1Id}/members`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          userId: otherUser.id,
          role: 'member',
        })
        .expect(201);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid tenant creation', async () => {
      // Duplicate slug
      await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Company One',
          slug: 'duplicate-slug',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Company Two',
          slug: 'duplicate-slug',
        })
        .expect(409);

      expect(response.body.error.code).toBe('TENANT_ALREADY_EXISTS');
    });

    it('should prevent removing last owner', async () => {
      // Create tenant
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Owner Test Company',
          slug: 'owner-test',
        });
      
      const tenantId = createResponse.body.data.id;

      // Try to remove the only owner
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/tenants/${tenantId}/members/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error.code).toBe('LAST_OWNER_REMOVAL');
    });

    it('should handle non-existent resources gracefully', async () => {
      const fakeId = faker.string.uuid();

      // Non-existent tenant
      await request(app.getHttpServer())
        .get(`/api/v1/tenants/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      // Non-existent member
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Company',
          slug: 'test-not-found',
        });
      
      const tenantId = createResponse.body.data.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/tenants/${tenantId}/members/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});