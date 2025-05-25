import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from '../../src/modules/tenants/services/tenants.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tenant } from '../../src/modules/tenants/entities/tenant.entity';
import { TenantMembership } from '../../src/modules/tenants/entities/tenant-membership.entity';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TenantsService', () => {
  let service: TenantsService;
  let tenantRepo: Repository<Tenant>;
  let membershipRepo: Repository<TenantMembership>;

  const mockTenantRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    find: jest.fn(),
  };
  const mockMembershipRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepo },
        { provide: getRepositoryToken(TenantMembership), useValue: mockMembershipRepo },
      ],
    }).compile();
    service = module.get<TenantsService>(TenantsService);
    tenantRepo = module.get(getRepositoryToken(Tenant));
    membershipRepo = module.get(getRepositoryToken(TenantMembership));
    jest.clearAllMocks();
  });

  describe('createTenant', () => {
    it('should throw if slug exists', async () => {
      mockTenantRepo.findOne.mockResolvedValue({ id: '1' });
      await expect(service.createTenant({ slug: 'test', name: 'Test' } as any)).rejects.toThrow(BadRequestException);
    });
    it('should create and save tenant', async () => {
      mockTenantRepo.findOne.mockResolvedValue(null);
      mockTenantRepo.create.mockReturnValue({ slug: 'test', name: 'Test' });
      mockTenantRepo.save.mockResolvedValue({ id: '1', slug: 'test', name: 'Test' });
      const result = await service.createTenant({ slug: 'test', name: 'Test' } as any);
      expect(result).toHaveProperty('id');
    });
  });

  describe('updateTenant', () => {
    it('should update and save tenant', async () => {
      mockTenantRepo.findOne.mockResolvedValue({ id: '1', name: 'Old' });
      mockTenantRepo.save.mockResolvedValue({ id: '1', name: 'New' });
      const result = await service.updateTenant('1', { name: 'New' } as any);
      expect(result.name).toBe('New');
    });
    it('should throw if tenant not found', async () => {
      mockTenantRepo.findOne.mockResolvedValue(null);
      await expect(service.updateTenant('1', { name: 'New' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTenant', () => {
    it('should remove tenant', async () => {
      mockTenantRepo.findOne.mockResolvedValue({ id: '1' });
      mockTenantRepo.remove.mockResolvedValue({});
      await expect(service.deleteTenant('1')).resolves.toBeUndefined();
    });
    it('should throw if tenant not found', async () => {
      mockTenantRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteTenant('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addUserToTenant', () => {
    it('should throw if user already a member', async () => {
      mockTenantRepo.findOne.mockResolvedValue({ id: '1' });
      mockMembershipRepo.findOne.mockResolvedValue({ id: 'm1' });
      await expect(service.addUserToTenant('1', 'u1', 'admin')).rejects.toThrow(BadRequestException);
    });
    it('should create and save membership', async () => {
      mockTenantRepo.findOne.mockResolvedValue({ id: '1' });
      mockMembershipRepo.findOne.mockResolvedValue(null);
      mockMembershipRepo.create.mockReturnValue({ tenantId: '1', userId: 'u1', role: 'admin' });
      mockMembershipRepo.save.mockResolvedValue({ id: 'm1', tenantId: '1', userId: 'u1', role: 'admin' });
      const result = await service.addUserToTenant('1', 'u1', 'admin');
      expect(result).toHaveProperty('id');
    });
  });

  describe('updateTenantMembership', () => {
    it('should update and save membership', async () => {
      mockMembershipRepo.findOne.mockResolvedValue({ id: 'm1', role: 'member' });
      mockMembershipRepo.save.mockResolvedValue({ id: 'm1', role: 'admin' });
      const result = await service.updateTenantMembership('m1', 'admin');
      expect(result.role).toBe('admin');
    });
    it('should throw if membership not found', async () => {
      mockMembershipRepo.findOne.mockResolvedValue(null);
      await expect(service.updateTenantMembership('m1', 'admin')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeUserFromTenant', () => {
    it('should remove membership', async () => {
      mockMembershipRepo.findOne.mockResolvedValue({ id: 'm1' });
      mockMembershipRepo.remove.mockResolvedValue({});
      await expect(service.removeUserFromTenant('1', 'u1')).resolves.toBeUndefined();
    });
    it('should throw if membership not found', async () => {
      mockMembershipRepo.findOne.mockResolvedValue(null);
      await expect(service.removeUserFromTenant('1', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listTenantMemberships', () => {
    it('should return memberships', async () => {
      mockMembershipRepo.find.mockResolvedValue([{ id: 'm1' }]);
      const result = await service.listTenantMemberships('1');
      expect(Array.isArray(result)).toBe(true);
    });
  });
}); 