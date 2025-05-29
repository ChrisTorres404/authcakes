import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from '../../src/modules/tenants/services/tenants.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tenant } from '../../src/modules/tenants/entities/tenant.entity';
import { TenantMembership } from '../../src/modules/tenants/entities/tenant-membership.entity';
import { Repository, FindOneOptions } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateTenantDto } from '../../src/modules/tenants/dto/create-tenant.dto';
import { UpdateTenantDto } from '../../src/modules/tenants/dto/update-tenant.dto';
import { TenantRole } from '../../src/modules/tenants/dto/tenant-invitation.dto';
import { User } from '../../src/modules/users/entities/user.entity';

/**
 * Interface for mock repository functions with proper typing
 */
interface MockRepository<T> {
  findOne: jest.Mock<Promise<T | null>, [FindOneOptions<T>?]>;
  create: jest.Mock<T, [Partial<T>]>;
  save: jest.Mock<Promise<T>, [Partial<T>]>;
  remove: jest.Mock<Promise<T>, [T]>;
  find: jest.Mock<Promise<T[]>, [FindOneOptions<T>?]>;
}

/**
 * Type definitions for the mock repositories used in tests
 */
type MockTenantRepo = MockRepository<Tenant>;
type MockMembershipRepo = MockRepository<TenantMembership>;

/**
 * Mock user data for testing tenant operations
 * Contains minimal required properties for tenant-related tests
 * @type {Partial<User>}
 */
const mockUser: Partial<User> = {
  id: 'u1',
  email: 'test@example.com',
  password: 'hashed_password',
  role: 'user',
  active: true,
  emailVerified: true,
  firstName: 'Test',
  lastName: 'User',
  tenantMemberships: [],
  sessions: [],
  refreshTokens: [],
  apiKeys: [],
  devices: [],
  mfaRecoveryCodes: [],
  webauthnCredentials: [],
  passwordHistory: [],
  logs: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Base mock objects with required properties for testing
 * Used as templates for creating test-specific instances
 */
const baseMockTenant: Tenant = {
  id: '1',
  name: 'Test Tenant',
  slug: 'test-tenant',
  logo: '',
  active: true,
  settings: {},
  memberships: [],
  apiKeys: [],
  invitations: [],
  logs: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: undefined,
};

const baseMockMembership: TenantMembership = {
  id: 'm1',
  userId: 'u1',
  tenantId: '1',
  role: TenantRole.MEMBER,
  user: mockUser as User,
  tenant: baseMockTenant,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: undefined,
};

/**
 * Test suite for TenantsService
 * Verifies tenant management functionality including CRUD operations
 * and user membership management
 */
describe('TenantsService', () => {
  let service: TenantsService;
  // These repositories are injected following NestJS testing patterns
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let tenantRepo: Repository<Tenant>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let membershipRepo: Repository<TenantMembership>;

  const mockTenantRepo: MockTenantRepo = {
    findOne: jest.fn<Promise<Tenant | null>, [FindOneOptions<Tenant>?]>(),
    create: jest.fn<Tenant, [Partial<Tenant>]>(),
    save: jest.fn<Promise<Tenant>, [Partial<Tenant>]>(),
    remove: jest.fn<Promise<Tenant>, [Tenant]>(),
    find: jest.fn<Promise<Tenant[]>, [FindOneOptions<Tenant>?]>(),
  };

  const mockMembershipRepo: MockMembershipRepo = {
    findOne: jest.fn<
      Promise<TenantMembership | null>,
      [FindOneOptions<TenantMembership>?]
    >(),
    create: jest.fn<TenantMembership, [Partial<TenantMembership>]>(),
    save: jest.fn<Promise<TenantMembership>, [Partial<TenantMembership>]>(),
    remove: jest.fn<Promise<TenantMembership>, [TenantMembership]>(),
    find: jest.fn<
      Promise<TenantMembership[]>,
      [FindOneOptions<TenantMembership>?]
    >(),
  };

  /**
   * Setup test module and inject dependencies
   */
  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepo },
        {
          provide: getRepositoryToken(TenantMembership),
          useValue: mockMembershipRepo,
        },
      ],
    }).compile();
    service = module.get<TenantsService>(TenantsService);
    tenantRepo = module.get(getRepositoryToken(Tenant));
    membershipRepo = module.get(getRepositoryToken(TenantMembership));
    jest.clearAllMocks();
  });

  /**
   * Tests for tenant creation functionality
   * Verifies proper handling of duplicate slugs and successful creation
   */
  describe('createTenant', () => {
    it('should throw if slug exists', async () => {
      mockTenantRepo.findOne.mockResolvedValue({ ...baseMockTenant });
      const createDto: CreateTenantDto = { slug: 'test', name: 'Test' };
      await expect(service.createTenant(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create and save tenant', async () => {
      mockTenantRepo.findOne.mockResolvedValue(null);
      const newTenant = { ...baseMockTenant };
      mockTenantRepo.create.mockReturnValue(newTenant);
      mockTenantRepo.save.mockResolvedValue(newTenant);

      const createDto: CreateTenantDto = { slug: 'test', name: 'Test' };
      const result = await service.createTenant(createDto);
      expect(result).toHaveProperty('id');
    });
  });

  /**
   * Tests for tenant update functionality
   * Verifies proper handling of non-existent tenants and successful updates
   */
  describe('updateTenant', () => {
    it('should update and save tenant', async () => {
      const oldTenant = { ...baseMockTenant, name: 'Old' };
      const updatedTenant = { ...baseMockTenant, name: 'New' };
      mockTenantRepo.findOne.mockResolvedValue(oldTenant);
      mockTenantRepo.save.mockResolvedValue(updatedTenant);

      const updateDto: UpdateTenantDto = { name: 'New' };
      const result = await service.updateTenant('1', updateDto);
      expect(result.name).toBe('New');
    });

    it('should throw if tenant not found', async () => {
      mockTenantRepo.findOne.mockResolvedValue(null);
      await expect(service.updateTenant('1', { name: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * Tests for tenant deletion functionality
   * Verifies proper handling of non-existent tenants and successful deletion
   */
  describe('deleteTenant', () => {
    it('should remove tenant', async () => {
      const tenant = { ...baseMockTenant };
      mockTenantRepo.findOne.mockResolvedValue(tenant);
      mockTenantRepo.remove.mockResolvedValue(tenant);
      await expect(service.deleteTenant('1')).resolves.toBeUndefined();
    });

    it('should throw if tenant not found', async () => {
      mockTenantRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteTenant('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * Tests for adding users to tenants
   * Verifies duplicate membership handling and successful user addition
   */
  describe('addUserToTenant', () => {
    it('should throw if user already a member', async () => {
      const tenant = { ...baseMockTenant };
      const membership = { ...baseMockMembership };
      mockTenantRepo.findOne.mockResolvedValue(tenant);
      mockMembershipRepo.findOne.mockResolvedValue(membership);
      await expect(
        service.addUserToTenant('1', 'u1', TenantRole.ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create and save membership', async () => {
      const tenant = { ...baseMockTenant };
      const newMembership = {
        ...baseMockMembership,
        role: TenantRole.ADMIN,
      };
      mockTenantRepo.findOne.mockResolvedValue(tenant);
      mockMembershipRepo.findOne.mockResolvedValue(null);
      mockMembershipRepo.create.mockReturnValue(newMembership);
      mockMembershipRepo.save.mockResolvedValue(newMembership);

      const result = await service.addUserToTenant('1', 'u1', TenantRole.ADMIN);
      expect(result).toHaveProperty('id');
    });
  });

  /**
   * Tests for updating tenant membership roles
   * Verifies proper handling of non-existent memberships and role updates
   */
  describe('updateTenantMembership', () => {
    it('should update and save membership', async () => {
      const membership = { ...baseMockMembership };
      const updatedMembership = {
        ...baseMockMembership,
        role: TenantRole.ADMIN,
      };
      mockMembershipRepo.findOne.mockResolvedValue(membership);
      mockMembershipRepo.save.mockResolvedValue(updatedMembership);
      const result = await service.updateTenantMembership(
        'm1',
        TenantRole.ADMIN,
      );
      expect(result.role).toBe(TenantRole.ADMIN);
    });

    it('should throw if membership not found', async () => {
      mockMembershipRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateTenantMembership('m1', TenantRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * Tests for removing users from tenants
   * Verifies proper handling of non-existent memberships and successful removal
   */
  describe('removeUserFromTenant', () => {
    it('should remove membership', async () => {
      const membership = { ...baseMockMembership };
      mockMembershipRepo.findOne.mockResolvedValue(membership);
      mockMembershipRepo.remove.mockResolvedValue(membership);
      await expect(
        service.removeUserFromTenant('1', 'u1'),
      ).resolves.toBeUndefined();
    });

    it('should throw if membership not found', async () => {
      mockMembershipRepo.findOne.mockResolvedValue(null);
      await expect(service.removeUserFromTenant('1', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * Tests for listing tenant memberships
   * Verifies successful retrieval of membership lists
   */
  describe('listTenantMemberships', () => {
    it('should return memberships', async () => {
      const membership = { ...baseMockMembership };
      mockMembershipRepo.find.mockResolvedValue([membership]);
      const result = await service.listTenantMemberships('1');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
