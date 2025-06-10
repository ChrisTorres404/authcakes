import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { TenantsService } from '../../../src/modules/tenants/services/tenants.service';
import { Tenant } from '../../../src/modules/tenants/entities/tenant.entity';
import { TenantMembership } from '../../../src/modules/tenants/entities/tenant-membership.entity';
import { TenantInvitation } from '../../../src/modules/tenants/entities/tenant-invitation.entity';
import { TenantRole } from '../../../src/modules/tenants/dto/tenant-invitation.dto';
import { faker } from '@faker-js/faker';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';

describe('TenantsService', () => {
  let service: TenantsService;
  let tenantRepository: Repository<Tenant>;
  let membershipRepository: Repository<TenantMembership>;
  let invitationRepository: Repository<TenantInvitation>;

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
    createdAt: new Date(),
    updatedAt: new Date(),
    user: undefined as any,
    tenant: undefined as any,
    ...overrides,
  });

  const createMockInvitation = (overrides?: Partial<TenantInvitation>): TenantInvitation => ({
    id: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    email: faker.internet.email(),
    role: TenantRole.MEMBER,
    token: faker.string.alphanumeric(32),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    invitedBy: faker.string.uuid(),
    acceptedAt: undefined as any,
    acceptedBy: undefined as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenant: undefined as any,
    inviter: undefined as any,
    acceptor: undefined as any,
    ...overrides,
  });

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
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
            remove: jest.fn(),
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
            remove: jest.fn(),
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
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    tenantRepository = module.get<Repository<Tenant>>(getRepositoryToken(Tenant));
    membershipRepository = module.get<Repository<TenantMembership>>(getRepositoryToken(TenantMembership));
    invitationRepository = module.get<Repository<TenantInvitation>>(getRepositoryToken(TenantInvitation));
  });

  describe('create', () => {
    it('should create a new tenant', async () => {
      const createDto = {
        name: 'Test Company',
        slug: 'test-company',
      };
      const tenant = createMockTenant(createDto);

      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(tenantRepository, 'create').mockReturnValue(tenant);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(tenant);

      const result = await service.create(createDto);

      expect(result).toEqual(tenant);
      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { slug: createDto.slug },
      });
      expect(tenantRepository.create).toHaveBeenCalledWith(createDto);
      expect(tenantRepository.save).toHaveBeenCalledWith(tenant);
    });

    it('should throw ConflictException if slug already exists', async () => {
      const createDto = {
        name: 'Test Company',
        slug: 'existing-slug',
      };
      const existingTenant = createMockTenant({ slug: createDto.slug });

      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(existingTenant);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should create tenant without checking slug if not provided', async () => {
      const createDto = {
        name: 'Test Company',
      };
      const tenant = createMockTenant(createDto);

      jest.spyOn(tenantRepository, 'create').mockReturnValue(tenant);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(tenant);

      const result = await service.create(createDto);

      expect(result).toEqual(tenant);
      expect(tenantRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all active tenants', async () => {
      const tenants = Array.from({ length: 5 }, () => createMockTenant());

      jest.spyOn(tenantRepository, 'find').mockResolvedValue(tenants);

      const result = await service.findAll();

      expect(result).toEqual(tenants);
      expect(tenantRepository.find).toHaveBeenCalledWith({
        where: { active: true },
      });
    });
  });

  describe('findById', () => {
    it('should return tenant by id', async () => {
      const tenant = createMockTenant();
      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(tenant);

      const result = await service.findById(tenant.id);

      expect(result).toEqual(tenant);
      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { id: tenant.id },
      });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return tenant by slug', async () => {
      const tenant = createMockTenant({ slug: 'test-slug' });
      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(tenant);

      const result = await service.findBySlug('test-slug');

      expect(result).toEqual(tenant);
      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'test-slug', active: true },
      });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findBySlug('non-existent-slug')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update tenant details', async () => {
      const tenant = createMockTenant();
      const updateDto = { name: 'Updated Name' };
      const updatedTenant = { ...tenant, ...updateDto };

      jest.spyOn(service, 'findById').mockResolvedValue(tenant);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(updatedTenant);

      const result = await service.update(tenant.id, updateDto);

      expect(result).toEqual(updatedTenant);
      expect(tenantRepository.save).toHaveBeenCalledWith(updatedTenant);
    });

    it('should throw ConflictException if new slug is taken', async () => {
      const tenant = createMockTenant({ slug: 'old-slug' });
      const existingTenant = createMockTenant({ slug: 'taken-slug' });
      const updateDto = { slug: 'taken-slug' };

      jest.spyOn(service, 'findById').mockResolvedValue(tenant);
      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(existingTenant);

      await expect(service.update(tenant.id, updateDto)).rejects.toThrow(ConflictException);
    });

    it('should allow updating to same slug', async () => {
      const tenant = createMockTenant({ slug: 'my-slug' });
      const updateDto = { slug: 'my-slug', name: 'New Name' };
      const updatedTenant = { ...tenant, ...updateDto };

      jest.spyOn(service, 'findById').mockResolvedValue(tenant);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(updatedTenant);

      const result = await service.update(tenant.id, updateDto);

      expect(result).toEqual(updatedTenant);
      expect(tenantRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should hard delete tenant', async () => {
      const tenant = createMockTenant();

      jest.spyOn(service, 'findById').mockResolvedValue(tenant);
      jest.spyOn(tenantRepository, 'remove').mockResolvedValue(tenant);

      await service.delete(tenant.id);

      expect(tenantRepository.remove).toHaveBeenCalledWith(tenant);
    });
  });

  describe('softDelete', () => {
    it('should soft delete tenant', async () => {
      const tenant = createMockTenant();
      const softDeletedTenant = { ...tenant, active: false };

      jest.spyOn(service, 'findById').mockResolvedValue(tenant);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(softDeletedTenant);

      await service.softDelete(tenant.id);

      expect(tenant.active).toBe(false);
      expect(tenantRepository.save).toHaveBeenCalledWith(tenant);
    });
  });

  describe('addUserToTenant', () => {
    it('should add new member to tenant', async () => {
      const tenant = createMockTenant();
      const userId = faker.string.uuid();
      const membership = createMockMembership({
        tenant,
        userId,
        tenantId: tenant.id,
        role: TenantRole.MEMBER,
      });

      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(service, 'findById').mockResolvedValue(tenant);
      jest.spyOn(membershipRepository, 'create').mockReturnValue(membership);
      jest.spyOn(membershipRepository, 'save').mockResolvedValue(membership);

      const result = await service.addUserToTenant(userId, tenant.id, TenantRole.MEMBER);

      expect(result).toEqual(membership);
      expect(membershipRepository.findOne).toHaveBeenCalledWith({
        where: { userId, tenantId: tenant.id },
      });
    });

    it('should throw ConflictException if user already a member', async () => {
      const tenant = createMockTenant();
      const userId = faker.string.uuid();
      const existingMembership = createMockMembership({
        userId,
        tenantId: tenant.id,
      });

      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(existingMembership);

      await expect(service.addUserToTenant(userId, tenant.id)).rejects.toThrow(ConflictException);
    });
  });

  describe('removeUserFromTenant', () => {
    it('should remove user from tenant', async () => {
      const membership = createMockMembership();

      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(membership);
      jest.spyOn(membershipRepository, 'remove').mockResolvedValue(membership);

      await service.removeUserFromTenant(membership.userId, membership.tenantId);

      expect(membershipRepository.remove).toHaveBeenCalledWith(membership);
    });

    it('should throw NotFoundException if membership not found', async () => {
      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(null);

      await expect(service.removeUserFromTenant('user-id', 'tenant-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUserTenantRole', () => {
    it('should update member role', async () => {
      const membership = createMockMembership({ role: TenantRole.MEMBER });
      const updatedMembership = { ...membership, role: TenantRole.ADMIN };

      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(membership);
      jest.spyOn(membershipRepository, 'save').mockResolvedValue(updatedMembership);

      const result = await service.updateUserTenantRole(membership.userId, membership.tenantId, TenantRole.ADMIN);

      expect(result).toEqual(updatedMembership);
      expect(membership.role).toBe(TenantRole.ADMIN);
    });

    it('should throw NotFoundException if membership not found', async () => {
      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateUserTenantRole('user-id', 'tenant-id', TenantRole.ADMIN))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('inviteUserToTenant', () => {
    it('should create and return tenant invitation', async () => {
      const tenant = createMockTenant();
      const invitedBy = faker.string.uuid();
      const email = faker.internet.email();
      const invitation = createMockInvitation({
        tenantId: tenant.id,
        email,
        invitedBy,
        role: TenantRole.MEMBER,
      });

      jest.spyOn(service, 'findById').mockResolvedValue(tenant);
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(invitationRepository, 'create').mockReturnValue(invitation);
      jest.spyOn(invitationRepository, 'save').mockResolvedValue(invitation);

      const result = await service.inviteUserToTenant(tenant.id, invitedBy, email, TenantRole.MEMBER);

      expect(result).toEqual(invitation);
      expect(invitationRepository.findOne).toHaveBeenCalledWith({
        where: {
          tenantId: tenant.id,
          email,
          acceptedAt: IsNull(),
        },
      });
    });

    it('should throw ConflictException if invitation already exists', async () => {
      const tenant = createMockTenant();
      const existingInvitation = createMockInvitation();

      jest.spyOn(service, 'findById').mockResolvedValue(tenant);
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(existingInvitation);

      await expect(service.inviteUserToTenant(tenant.id, 'user-id', 'test@example.com'))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and create membership', async () => {
      const tenant = createMockTenant();
      const userId = faker.string.uuid();
      const invitation = createMockInvitation({
        tenantId: tenant.id,
        role: TenantRole.MEMBER,
      });
      const membership = createMockMembership({
        userId,
        tenantId: tenant.id,
        role: invitation.role as any,
      });

      jest.spyOn(service, 'getInvitationByToken').mockResolvedValue(invitation);
      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(invitationRepository, 'save').mockResolvedValue({
        ...invitation,
        acceptedAt: new Date(),
        acceptedBy: userId,
      });
      jest.spyOn(service, 'addUserToTenant').mockResolvedValue(membership);

      const result = await service.acceptInvitation(invitation.token, userId);

      expect(result).toEqual(membership);
      expect(invitation.acceptedAt).toBeDefined();
      expect(invitation.acceptedBy).toBe(userId);
    });

    it('should throw ConflictException if user already a member', async () => {
      const invitation = createMockInvitation();
      const existingMembership = createMockMembership();

      jest.spyOn(service, 'getInvitationByToken').mockResolvedValue(invitation);
      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(existingMembership);

      await expect(service.acceptInvitation(invitation.token, 'user-id'))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('getInvitationByToken', () => {
    it('should return valid invitation', async () => {
      const invitation = createMockInvitation();

      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(invitation);

      const result = await service.getInvitationByToken(invitation.token);

      expect(result).toEqual(invitation);
    });

    it('should throw NotFoundException for invalid token', async () => {
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getInvitationByToken('invalid-token'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for expired invitation', async () => {
      const invitation = createMockInvitation({
        expiresAt: new Date(Date.now() - 1000000),
      });

      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(invitation);

      await expect(service.getInvitationByToken(invitation.token))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for already accepted invitation', async () => {
      const invitation = createMockInvitation({
        acceptedAt: new Date(),
      });

      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(invitation);

      await expect(service.getInvitationByToken(invitation.token))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserTenantMembership', () => {
    it('should return user tenant membership', async () => {
      const membership = createMockMembership();

      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(membership);

      const result = await service.getUserTenantMembership(membership.userId, membership.tenantId);

      expect(result).toEqual(membership);
      expect(membershipRepository.findOne).toHaveBeenCalledWith({
        where: { userId: membership.userId, tenantId: membership.tenantId },
        relations: ['tenant'],
      });
    });

    it('should return null if membership not found', async () => {
      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getUserTenantMembership('user-id', 'tenant-id');

      expect(result).toBeNull();
    });

    it('should throw BadRequestException if tenantId is missing', async () => {
      await expect(service.getUserTenantMembership('user-id', null as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserTenantMemberships', () => {
    it('should return all user tenant memberships', async () => {
      const memberships = [
        createMockMembership(),
        createMockMembership(),
        createMockMembership(),
      ];

      jest.spyOn(membershipRepository, 'find').mockResolvedValue(memberships);

      const result = await service.getUserTenantMemberships('user-id');

      expect(result).toEqual(memberships);
      expect(membershipRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        relations: ['tenant'],
      });
    });
  });

  describe('updateUserTenantRole with edge cases', () => {
    it('should throw BadRequestException if tenantId is missing', async () => {
      await expect(service.updateUserTenantRole('user-id', null as any, TenantRole.ADMIN))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('removeUserFromTenant with edge cases', () => {
    it('should throw BadRequestException if tenantId is missing', async () => {
      await expect(service.removeUserFromTenant('user-id', null as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getTenantInvitations', () => {
    it('should return tenant invitations', async () => {
      const invitations = [
        createMockInvitation(),
        createMockInvitation(),
      ];

      jest.spyOn(invitationRepository, 'find').mockResolvedValue(invitations);

      const result = await service.getTenantInvitations('tenant-id');

      expect(result).toEqual(invitations);
      expect(invitationRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-id', acceptedAt: IsNull() },
        relations: ['tenant'],
      });
    });

    it('should throw BadRequestException if tenantId is missing', async () => {
      await expect(service.getTenantInvitations(null as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelInvitation', () => {
    it('should cancel invitation', async () => {
      const invitation = createMockInvitation();

      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(invitation);
      jest.spyOn(invitationRepository, 'remove').mockResolvedValue(invitation);

      await service.cancelInvitation(invitation.id);

      expect(invitationRepository.remove).toHaveBeenCalledWith(invitation);
    });

    it('should throw NotFoundException if invitation not found', async () => {
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(null);

      await expect(service.cancelInvitation('invalid-id'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('alias methods', () => {
    it('createTenant should call create', async () => {
      const createDto = { name: 'Test', slug: 'test' };
      const tenant = createMockTenant(createDto);

      jest.spyOn(service, 'create').mockResolvedValue(tenant);

      const result = await service.createTenant(createDto);

      expect(result).toEqual(tenant);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('getTenantById should call findById', async () => {
      const tenant = createMockTenant();

      jest.spyOn(service, 'findById').mockResolvedValue(tenant);

      const result = await service.getTenantById(tenant.id);

      expect(result).toEqual(tenant);
      expect(service.findById).toHaveBeenCalledWith(tenant.id);
    });
  });

  describe('listTenants', () => {
    it('should list tenants with pagination', async () => {
      const tenants = [createMockTenant(), createMockTenant()];

      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.skip.mockReturnThis();
      mockQueryBuilder.take.mockReturnThis();
      mockQueryBuilder.getMany.mockResolvedValue(tenants);

      const result = await service.listTenants({ page: 2, limit: 20 });

      expect(result).toEqual(tenants);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('should filter by search term', async () => {
      const tenants = [createMockTenant()];

      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.andWhere.mockReturnThis();
      mockQueryBuilder.skip.mockReturnThis();
      mockQueryBuilder.take.mockReturnThis();
      mockQueryBuilder.getMany.mockResolvedValue(tenants);

      const result = await service.listTenants({ search: 'test' });

      expect(result).toEqual(tenants);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'tenant.name ILIKE :search OR tenant.slug ILIKE :search',
        { search: '%test%' }
      );
    });

    it('should use defaults when no params provided', async () => {
      const tenants = [createMockTenant()];

      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.skip.mockReturnThis();
      mockQueryBuilder.take.mockReturnThis();
      mockQueryBuilder.getMany.mockResolvedValue(tenants);

      const result = await service.listTenants();

      expect(result).toEqual(tenants);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });

  describe('getTenantMembers', () => {
    it('should return tenant members', async () => {
      const members = [createMockMembership(), createMockMembership()];

      jest.spyOn(membershipRepository, 'find').mockResolvedValue(members);

      const result = await service.getTenantMembers('tenant-id');

      expect(result).toEqual(members);
      expect(membershipRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-id' },
        relations: ['user'],
      });
    });

    it('should throw BadRequestException if tenantId is missing', async () => {
      await expect(service.getTenantMembers(null as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('more alias methods', () => {
    it('updateTenant should call update', async () => {
      const updateDto = { name: 'Updated' };
      const tenant = createMockTenant(updateDto);

      jest.spyOn(service, 'update').mockResolvedValue(tenant);

      const result = await service.updateTenant('tenant-id', updateDto);

      expect(result).toEqual(tenant);
      expect(service.update).toHaveBeenCalledWith('tenant-id', updateDto);
    });

    it('deleteTenant should call delete', async () => {
      jest.spyOn(service, 'delete').mockResolvedValue(undefined);

      await service.deleteTenant('tenant-id');

      expect(service.delete).toHaveBeenCalledWith('tenant-id');
    });

    it('getMembers should call getTenantMembers', async () => {
      const members = [createMockMembership()];

      jest.spyOn(service, 'getTenantMembers').mockResolvedValue(members);

      const result = await service.getMembers('tenant-id');

      expect(result).toEqual(members);
      expect(service.getTenantMembers).toHaveBeenCalledWith('tenant-id');
    });

    it('getMembers should throw BadRequestException if tenantId missing', async () => {
      await expect(service.getMembers(null as any))
        .rejects.toThrow(BadRequestException);
    });

    it('listTenantMemberships should call getTenantMembers', async () => {
      const members = [createMockMembership()];

      jest.spyOn(service, 'getTenantMembers').mockResolvedValue(members);

      const result = await service.listTenantMemberships('tenant-id');

      expect(result).toEqual(members);
      expect(service.getTenantMembers).toHaveBeenCalledWith('tenant-id');
    });

    it('listTenantMemberships should throw BadRequestException if tenantId missing', async () => {
      await expect(service.listTenantMemberships(null as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateTenantMembership', () => {
    it('should update membership role by id', async () => {
      const membership = createMockMembership({ role: TenantRole.MEMBER as any });
      const updatedMembership = { ...membership, role: TenantRole.ADMIN as any };

      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(membership);
      jest.spyOn(membershipRepository, 'save').mockResolvedValue(updatedMembership);

      const result = await service.updateTenantMembership(membership.id, TenantRole.ADMIN);

      expect(result).toEqual(updatedMembership);
      expect(membership.role).toBe(TenantRole.ADMIN as any);
    });

    it('should throw NotFoundException if membership not found', async () => {
      jest.spyOn(membershipRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateTenantMembership('invalid-id', TenantRole.ADMIN))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('inviteMember', () => {
    it('should create invitation through inviteUserToTenant', async () => {
      const dto = {
        email: faker.internet.email(),
        role: TenantRole.MEMBER,
        invitedBy: faker.string.uuid(),
      };
      const invitation = createMockInvitation(dto);

      jest.spyOn(service, 'inviteUserToTenant').mockResolvedValue(invitation);

      const result = await service.inviteMember('tenant-id', dto);

      expect(result).toEqual(invitation);
      expect(service.inviteUserToTenant).toHaveBeenCalledWith(
        'tenant-id',
        dto.invitedBy,
        dto.email,
        dto.role
      );
    });

    it('should throw BadRequestException if tenantId missing', async () => {
      await expect(service.inviteMember(null as any, {
        email: 'test@example.com',
        role: TenantRole.MEMBER,
        invitedBy: 'user-id',
      }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role through getUserTenantMembership', async () => {
      const membership = createMockMembership({ role: TenantRole.MEMBER as any });
      const updatedMembership = { ...membership, role: TenantRole.ADMIN as any };

      jest.spyOn(service, 'getUserTenantMembership').mockResolvedValue(membership);
      jest.spyOn(membershipRepository, 'save').mockResolvedValue(updatedMembership);

      const result = await service.updateMemberRole('tenant-id', 'user-id', { role: TenantRole.ADMIN });

      expect(result).toEqual(updatedMembership);
      expect(membership.role).toBe(TenantRole.ADMIN);
    });

    it('should throw NotFoundException if membership not found', async () => {
      jest.spyOn(service, 'getUserTenantMembership').mockResolvedValue(null);

      await expect(service.updateMemberRole('tenant-id', 'user-id', { role: TenantRole.ADMIN }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if tenantId missing', async () => {
      await expect(service.updateMemberRole(null as any, 'user-id', { role: TenantRole.ADMIN }))
        .rejects.toThrow(BadRequestException);
    });
  });
});