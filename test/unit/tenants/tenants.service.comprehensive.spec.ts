import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { TenantsService } from '../../../src/modules/tenants/services/tenants.service';
import { Tenant } from '../../../src/modules/tenants/entities/tenant.entity';
import { TenantMembership } from '../../../src/modules/tenants/entities/tenant-membership.entity';
import { TenantInvitation } from '../../../src/modules/tenants/entities/tenant-invitation.entity';
import { User } from '../../../src/modules/users/entities/user.entity';
import { UsersService } from '../../../src/modules/users/services/users.service';
import { NotificationService } from '../../../src/modules/auth/services/notification.service';
import { TenantFactory } from '../../factories/tenant.factory';
import { UserFactory } from '../../factories/user.factory';
import { faker } from '@faker-js/faker';
import { BadRequestException, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';

describe('TenantsService (Comprehensive)', () => {
  let service: TenantsService;
  let tenantRepository: Repository<Tenant>;
  let membershipRepository: Repository<TenantMembership>;
  let invitationRepository: Repository<TenantInvitation>;
  let usersService: UsersService;
  let notificationService: NotificationService;
  let dataSource: DataSource;

  const createMockTenant = (overrides?: Partial<Tenant>): Tenant => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
    logo: faker.image.url(),
    active: true,
    settings: {},
    memberships: [],
    apiKeys: [],
    invitations: [],
    logs: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockMembership = (overrides?: Partial<TenantMembership>): TenantMembership => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    role: 'member',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: null,
    tenant: null,
    ...overrides,
  });

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    select: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(TenantMembership),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(TenantInvitation),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendTenantInvitation: jest.fn(),
            sendTenantMembershipNotification: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
            createQueryRunner: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    tenantRepository = module.get<Repository<Tenant>>(getRepositoryToken(Tenant));
    membershipRepository = module.get<Repository<TenantMembership>>(getRepositoryToken(TenantMembership));
    invitationRepository = module.get<Repository<TenantInvitation>>(getRepositoryToken(TenantInvitation));
    usersService = module.get<UsersService>(UsersService);
    notificationService = module.get<NotificationService>(NotificationService);
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('create', () => {
    it('should create a new tenant with owner membership', async () => {
      const createDto = {
        name: 'Test Company',
        slug: 'test-company',
      };
      const userId = faker.string.uuid();
      const tenant = createMockTenant({ ...createDto });
      const membership = createMockMembership({
        tenant,
        userId,
        role: 'owner',
      });

      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(tenant);
      jest.spyOn(membershipRepository, 'save').mockResolvedValue(membership);
      jest.spyOn(dataSource, 'transaction').mockImplementation(async (cb) => cb({
        save: jest.fn().mockImplementation((entity) => {
          if (entity instanceof Tenant) return tenant;
          if (entity instanceof TenantMembership) return membership;
          return entity;
        }),
      }));

      const result = await service.create(createDto, userId);

      expect(result).toEqual(tenant);
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if slug already exists', async () => {
      const createDto = {
        name: 'Test Company',
        slug: 'existing-slug',
      };
      const userId = faker.string.uuid();
      const existingTenant = createMockTenant({ slug: createDto.slug });

      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(existingTenant);

      await expect(service.create(createDto, userId)).rejects.toThrow(ConflictException);
    });

    it('should sanitize slug to ensure URL safety', async () => {
      const createDto = {
        name: 'Test Company!!!',
        slug: 'Test Company!!!',
      };
      const userId = faker.string.uuid();
      const tenant = createMockTenant({
        name: createDto.name,
        slug: 'test-company',
      });

      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(tenant);
      jest.spyOn(dataSource, 'transaction').mockImplementation(async (cb) => cb({
        save: jest.fn().mockResolvedValue(tenant),
      }));

      const result = await service.create(createDto, userId);

      expect(result.slug).toBe('test-company');
    });
  });

  describe('findAll', () => {
    it('should return paginated tenants', async () => {
      const tenants = Array.from({ length: 5 }, () => createMockTenant());
      const total = 10;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([tenants, total]);

      const result = await service.findAll();

      expect(result).toEqual({
        tenants
      });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('should filter by search query', async () => {
      const tenants = Array.from({ length: 3 }, () => createMockTenant());
      mockQueryBuilder.getManyAndCount.mockResolvedValue([tenants, 3]);

      await service.findAll();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(tenant.name ILIKE :search OR tenant.subdomain ILIKE :search)',
        { search: '%test%' }
      );
    });

    it('should filter by active status', async () => {
      const activeTenants = Array.from({ length: 3 }, () => createMockTenant({ active: true }));
      mockQueryBuilder.getManyAndCount.mockResolvedValue([activeTenants, 3]);

      await service.findAll();

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'tenant.active = :active',
        { active: true }
      );
    });
  });

  describe('findById', () => {
    it('should return tenant by id', async () => {
      const tenant = TenantFactory.create();
      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(tenant);

      const result = await service.findById(tenant.id);

      expect(result).toEqual(tenant);
      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { id: tenant.id },
        relations: ['memberships', 'memberships.user'],
      });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update tenant details', async () => {
      const tenant = TenantFactory.create();
      const updateDto = { name: 'Updated Name' };
      const updatedTenant = { ...tenant, ...updateDto };

      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(tenant);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(updatedTenant);

      const result = await service.update(tenant.id, updateDto);

      expect(result).toEqual(updatedTenant);
      expect(tenantRepository.save).toHaveBeenCalledWith(updatedTenant);
    });

    it('should throw ConflictException if subdomain is taken', async () => {
      const tenant = TenantFactory.create();
      const existingTenant = TenantFactory.create({ subdomain: 'taken' });
      const updateDto = { subdomain: 'taken' };

      jest.spyOn(tenantRepository, 'findOne')
        .mockResolvedValueOnce(tenant)
        .mockResolvedValueOnce(existingTenant);

      await expect(service.update(tenant.id, updateDto)).rejects.toThrow(ConflictException);
    });

    it('should allow updating to same subdomain', async () => {
      const tenant = TenantFactory.create({ subdomain: 'my-subdomain' });
      const updateDto = { subdomain: 'my-subdomain', name: 'New Name' };
      const updatedTenant = { ...tenant, ...updateDto };

      jest.spyOn(tenantRepository, 'findOne')
        .mockResolvedValueOnce(tenant)
        .mockResolvedValueOnce(tenant);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(updatedTenant);

      const result = await service.update(tenant.id, updateDto);

      expect(result).toEqual(updatedTenant);
    });
  });

  describe('delete', () => {
    it('should soft delete tenant', async () => {
      const tenant = TenantFactory.create();
      const deletedTenant = { ...tenant, isActive: false };

      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(tenant);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(deletedTenant);

      await service.delete(tenant.id);

      expect(tenantRepository.save).toHaveBeenCalledWith({
        ...tenant,
        isActive: false,
      });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addMember', () => {
    it('should add new member to tenant', async () => {
      const tenant = TenantFactory.create();
      const user = UserFactory.create();
      const membership = {
        id: faker.string.uuid(),
        tenant,
        user,
        role: 'member',
        isActive: true,
      };

      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(tenant);
      jest.spyOn(usersService, 'findById').mockResolvedValue(user);
      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(membershipRepository, 'save').mockResolvedValue(membership as TenantMembership);

      const result = await service.addMember(tenant.id, user.id, 'member');

      expect(result).toEqual(membership);
      expect(notificationService.sendTenantMembershipNotification).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already a member', async () => {
      const tenant = TenantFactory.create();
      const user = UserFactory.create();
      const existingMembership = {
        id: faker.string.uuid(),
        tenant,
        user,
        role: 'member',
        isActive: true,
      };

      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(tenant);
      jest.spyOn(usersService, 'findById').mockResolvedValue(user);
      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(existingMembership as TenantMembership);

      await expect(service.addMember(tenant.id, user.id, 'member')).rejects.toThrow(ConflictException);
    });

    it('should reactivate inactive membership', async () => {
      const tenant = TenantFactory.create();
      const user = UserFactory.create();
      const inactiveMembership = {
        id: faker.string.uuid(),
        tenant,
        user,
        role: 'member',
        isActive: false,
      };
      const activatedMembership = { ...inactiveMembership, isActive: true, role: 'admin' };

      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(tenant);
      jest.spyOn(usersService, 'findById').mockResolvedValue(user);
      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(inactiveMembership as TenantMembership);
      jest.spyOn(membershipRepository, 'save').mockResolvedValue(activatedMembership as TenantMembership);

      const result = await service.addMember(tenant.id, user.id, 'admin');

      expect(result).toEqual(activatedMembership);
      expect(membershipRepository.save).toHaveBeenCalledWith({
        ...inactiveMembership,
        isActive: true,
        role: 'admin',
      });
    });
  });

  describe('removeMember', () => {
    it('should deactivate membership', async () => {
      const tenant = TenantFactory.create();
      const user = UserFactory.create();
      const membership = {
        id: faker.string.uuid(),
        tenant,
        user,
        role: 'member',
        isActive: true,
      };

      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(membership as TenantMembership);
      jest.spyOn(membershipRepository, 'save').mockResolvedValue({
        ...membership,
        isActive: false,
      } as TenantMembership);

      await service.removeMember(tenant.id, user.id);

      expect(membershipRepository.save).toHaveBeenCalledWith({
        ...membership,
        isActive: false,
      });
    });

    it('should throw NotFoundException if membership not found', async () => {
      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(null);

      await expect(service.removeMember('tenant-id', 'user-id')).rejects.toThrow(NotFoundException);
    });

    it('should prevent removing the last owner', async () => {
      const tenant = TenantFactory.create();
      const owner = UserFactory.create();
      const ownerMembership = {
        id: faker.string.uuid(),
        tenant,
        user: owner,
        role: 'owner',
        isActive: true,
      };

      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(ownerMembership as TenantMembership);
      
      mockQueryBuilder.getOne.mockResolvedValue(null);
      jest.spyOn(membershipRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await expect(service.removeMember(tenant.id, owner.id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      const membership = {
        id: faker.string.uuid(),
        tenant: TenantFactory.create(),
        user: UserFactory.create(),
        role: 'member',
        isActive: true,
      };
      const updatedMembership = { ...membership, role: 'admin' };

      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(membership as TenantMembership);
      jest.spyOn(membershipRepository, 'save').mockResolvedValue(updatedMembership as TenantMembership);

      const result = await service.updateMemberRole(membership.tenant.id, membership.user.id, 'admin');

      expect(result).toEqual(updatedMembership);
    });

    it('should prevent changing role of last owner', async () => {
      const tenant = TenantFactory.create();
      const owner = UserFactory.create();
      const ownerMembership = {
        id: faker.string.uuid(),
        tenant,
        user: owner,
        role: 'owner',
        isActive: true,
      };

      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(ownerMembership as TenantMembership);
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.updateMemberRole(tenant.id, owner.id, 'admin')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMembers', () => {
    it('should return paginated tenant members', async () => {
      const members = Array.from({ length: 5 }, () => ({
        id: faker.string.uuid(),
        tenant: TenantFactory.create(),
        user: UserFactory.create(),
        role: faker.helpers.arrayElement(['owner', 'admin', 'member']),
        isActive: true,
      }));

      mockQueryBuilder.getManyAndCount.mockResolvedValue([members, 10]);

      const result = await service.getMembers('tenant-id', { page: 1, limit: 5 });

      expect(result).toEqual({
        data: members,
        total: 10,
        page: 1,
        limit: 5,
        totalPages: 2,
      });
    });

    it('should filter members by role', async () => {
      const admins = Array.from({ length: 3 }, () => ({
        id: faker.string.uuid(),
        tenant: TenantFactory.create(),
        user: UserFactory.create(),
        role: 'admin',
        isActive: true,
      }));

      mockQueryBuilder.getManyAndCount.mockResolvedValue([admins, 3]);

      await service.getMembers('tenant-id', { role: 'admin', page: 1, limit: 10 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'membership.role = :role',
        { role: 'admin' }
      );
    });
  });

  describe('createInvitation', () => {
    it('should create and send tenant invitation', async () => {
      const tenant = TenantFactory.create();
      const invitedBy = UserFactory.create();
      const invitation = {
        id: faker.string.uuid(),
        tenant,
        email: 'newuser@example.com',
        role: 'member',
        invitedBy,
        token: faker.string.alphanumeric(32),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(tenant);
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(invitationRepository, 'save').mockResolvedValue(invitation as TenantInvitation);

      const result = await service.createInvitation(
        tenant.id,
        { email: 'newuser@example.com', role: 'member' },
        invitedBy
      );

      expect(result).toEqual(invitation);
      expect(notificationService.sendTenantInvitation).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists and is a member', async () => {
      const tenant = TenantFactory.create();
      const existingUser = UserFactory.create();
      const invitedBy = UserFactory.create();
      const membership = {
        id: faker.string.uuid(),
        tenant,
        user: existingUser,
        role: 'member',
        isActive: true,
      };

      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(tenant);
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(existingUser);
      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(membership as TenantMembership);

      await expect(
        service.createInvitation(tenant.id, { email: existingUser.email, role: 'member' }, invitedBy)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and create membership', async () => {
      const tenant = TenantFactory.create();
      const user = UserFactory.create();
      const invitation = {
        id: faker.string.uuid(),
        tenant,
        email: user.email,
        role: 'member',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 1000000),
        acceptedAt: null,
      };
      const membership = {
        id: faker.string.uuid(),
        tenant,
        user,
        role: invitation.role,
        isActive: true,
      };

      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(invitation as TenantInvitation);
      jest.spyOn(membershipRepository, 'save').mockResolvedValue(membership as TenantMembership);
      jest.spyOn(invitationRepository, 'save').mockResolvedValue({
        ...invitation,
        acceptedAt: new Date(),
      } as TenantInvitation);

      const result = await service.acceptInvitation('valid-token', user);

      expect(result).toEqual(membership);
      expect(invitation.acceptedAt).toBeDefined();
    });

    it('should throw NotFoundException for invalid token', async () => {
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(null);

      await expect(service.acceptInvitation('invalid-token', UserFactory.create()))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for expired invitation', async () => {
      const invitation = {
        id: faker.string.uuid(),
        tenant: TenantFactory.create(),
        email: 'test@example.com',
        role: 'member',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000000),
        acceptedAt: null,
      };

      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(invitation as TenantInvitation);

      await expect(service.acceptInvitation('expired-token', UserFactory.create()))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('checkMembership', () => {
    it('should return true for active member', async () => {
      const membership = {
        id: faker.string.uuid(),
        tenant: TenantFactory.create(),
        user: UserFactory.create(),
        role: 'member',
        isActive: true,
      };

      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(membership as TenantMembership);

      const result = await service.checkMembership('tenant-id', 'user-id');

      expect(result).toBe(true);
    });

    it('should return false for non-member', async () => {
      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(null);

      const result = await service.checkMembership('tenant-id', 'user-id');

      expect(result).toBe(false);
    });

    it('should return false for inactive member', async () => {
      const membership = {
        id: faker.string.uuid(),
        tenant: TenantFactory.create(),
        user: UserFactory.create(),
        role: 'member',
        isActive: false,
      };

      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(membership as TenantMembership);

      const result = await service.checkMembership('tenant-id', 'user-id');

      expect(result).toBe(false);
    });
  });

  describe('getUserTenants', () => {
    it('should return all tenants for a user', async () => {
      const user = UserFactory.create();
      const memberships = Array.from({ length: 3 }, () => ({
        id: faker.string.uuid(),
        tenant: TenantFactory.create(),
        user,
        role: faker.helpers.arrayElement(['owner', 'admin', 'member']),
        isActive: true,
      }));

      mockQueryBuilder.getMany.mockResolvedValue(memberships);

      const result = await service.getUserTenants(user.id);

      expect(result).toEqual(memberships.map(m => ({
        ...m.tenant,
        role: m.role,
      })));
    });

    it('should only return active memberships', async () => {
      const user = UserFactory.create();
      
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.getUserTenants(user.id);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'membership.userId = :userId AND membership.isActive = true',
        { userId: user.id }
      );
    });
  });
});