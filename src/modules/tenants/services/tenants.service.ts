// src/modules/tenants/services/tenants.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import { Tenant } from '../entities/tenant.entity';
import { TenantMembership } from '../entities/tenant-membership.entity';
import { TenantInvitation } from '../entities/tenant-invitation.entity';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantMembership)
    private readonly tenantMembershipRepository: Repository<TenantMembership>,
    @InjectRepository(TenantInvitation)
    private readonly tenantInvitationRepository: Repository<TenantInvitation>,
  ) {}

  async create(data: Partial<Tenant>): Promise<Tenant> {
    // Validate slug uniqueness
    if (data.slug) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { slug: data.slug },
      });
      
      if (existingTenant) {
        throw new ConflictException('A tenant with this slug already exists');
      }
    }
    
    const tenant = this.tenantRepository.create(data);
    return this.tenantRepository.save(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      where: { active: true },
    });
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
    });
    
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { slug, active: true },
    });
    
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    
    return tenant;
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.findById(id);
    
    // Check slug uniqueness if it's being changed
    if (data.slug && data.slug !== tenant.slug) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { slug: data.slug },
      });
      
      if (existingTenant) {
        throw new ConflictException('A tenant with this slug already exists');
      }
    }
    
    Object.assign(tenant, data);
    return this.tenantRepository.save(tenant);
  }

  async delete(id: string): Promise<void> {
    const tenant = await this.findById(id);
    await this.tenantRepository.remove(tenant);
  }

  async softDelete(id: string): Promise<void> {
    const tenant = await this.findById(id);
    tenant.active = false;
    await this.tenantRepository.save(tenant);
  }

  // Tenant Membership Methods
  
  async addUserToTenant(userId: string, tenantId: string, role: string = 'member'): Promise<TenantMembership> {
    // Check if membership already exists
    const existingMembership = await this.tenantMembershipRepository.findOne({
      where: { userId, tenantId },
    });
    
    if (existingMembership) {
      throw new ConflictException('User is already a member of this tenant');
    }
    
    // Verify tenant exists
    await this.findById(tenantId);
    
    const membership = this.tenantMembershipRepository.create({
      userId,
      tenantId,
      role,
    });
    
    return this.tenantMembershipRepository.save(membership);
  }

  async getUserTenantMembership(userId: string, tenantId: string): Promise<TenantMembership | null> {
    if (!tenantId) {
      console.warn('[TenantsService] Warning: tenantId is missing in getUserTenantMembership');
      throw new BadRequestException('Tenant ID is required');
    }
    return this.tenantMembershipRepository.findOne({
      where: { userId, tenantId },
      relations: ['tenant'],
    });
  }

  async getUserTenantMemberships(userId: string): Promise<TenantMembership[]> {
    return this.tenantMembershipRepository.find({
      where: { userId },
      relations: ['tenant'],
    });
  }

  async updateUserTenantRole(userId: string, tenantId: string, role: string): Promise<TenantMembership> {
    if (!tenantId) {
      console.warn('[TenantsService] Warning: tenantId is missing in updateUserTenantRole');
      throw new BadRequestException('Tenant ID is required');
    }
    const membership = await this.tenantMembershipRepository.findOne({
      where: { userId, tenantId },
    });
    
    if (!membership) {
      throw new NotFoundException('Tenant membership not found');
    }
    
    membership.role = role;
    return this.tenantMembershipRepository.save(membership);
  }

  async removeUserFromTenant(userId: string, tenantId: string): Promise<void> {
    if (!tenantId) {
      console.warn('[TenantsService] Warning: tenantId is missing in removeUserFromTenant');
      throw new BadRequestException('Tenant ID is required');
    }
    const membership = await this.tenantMembershipRepository.findOne({
      where: { userId, tenantId },
    });
    
    if (!membership) {
      throw new NotFoundException('Tenant membership not found');
    }
    
    await this.tenantMembershipRepository.remove(membership);
  }

  async getTenantMembers(tenantId: string): Promise<TenantMembership[]> {
    if (!tenantId) {
      console.warn('[TenantsService] Warning: tenantId is missing in getTenantMembers');
      throw new BadRequestException('Tenant ID is required');
    }
    return this.tenantMembershipRepository.find({
      where: { tenantId },
      relations: ['user'],
    });
  }

  // Tenant Invitation Methods
  
  async inviteUserToTenant(
    tenantId: string, 
    invitedBy: string, 
    email: string, 
    role: string = 'member'
  ): Promise<TenantInvitation> {
    // Verify tenant exists
    await this.findById(tenantId);
    
    // Check if invitation already exists
    const existingInvitation = await this.tenantInvitationRepository.findOne({
      where: { 
        tenantId, 
        email,
        acceptedAt: IsNull(),
      },
    });
    
    if (existingInvitation) {
      throw new ConflictException('An invitation has already been sent to this email');
    }

    // Generate invitation
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
    
    const invitation = this.tenantInvitationRepository.create({
      tenantId,
      invitedBy,
      email,
      role,
      token,
      expiresAt,
    });
    
    return this.tenantInvitationRepository.save(invitation);
  }

  async getInvitationByToken(token: string): Promise<TenantInvitation> {
    const invitation = await this.tenantInvitationRepository.findOne({
      where: { token },
      relations: ['tenant'],
    });
    
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    
    // Check if expired
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }
    
    // Check if already accepted
    if (invitation.acceptedAt) {
      throw new BadRequestException('Invitation has already been accepted');
    }
    
    return invitation;
  }

  async acceptInvitation(token: string, userId: string): Promise<TenantMembership> {
    const invitation = await this.getInvitationByToken(token);
    
    // Check if user is already a member
    const existingMembership = await this.tenantMembershipRepository.findOne({
      where: { userId, tenantId: invitation.tenantId },
    });
    
    if (existingMembership) {
      throw new ConflictException('User is already a member of this tenant');
    }
    
    // Mark invitation as accepted
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = userId;
    await this.tenantInvitationRepository.save(invitation);
    
    // Create membership
    return this.addUserToTenant(userId, invitation.tenantId, invitation.role);
  }

  async getTenantInvitations(tenantId: string): Promise<TenantInvitation[]> {
    if (!tenantId) {
      console.warn('[TenantsService] Warning: tenantId is missing in getTenantInvitations');
      throw new BadRequestException('Tenant ID is required');
    }
    return this.tenantInvitationRepository.find({
      where: { tenantId, acceptedAt: IsNull() },
      relations: ['tenant'],
    });
  }

  async cancelInvitation(id: string): Promise<void> {
    const invitation = await this.tenantInvitationRepository.findOne({
      where: { id },
    });
    
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    
    await this.tenantInvitationRepository.remove(invitation);
  }

  // Alias methods for controller compatibility
  async createTenant(data: any): Promise<Tenant> {
    return this.create(data);
  }

  async getTenantById(id: string): Promise<Tenant> {
    return this.findById(id);
  }

  async listTenants(): Promise<Tenant[]> {
    return this.findAll();
  }

  async updateTenant(id: string, data: any): Promise<Tenant> {
    return this.update(id, data);
  }

  async deleteTenant(id: string): Promise<void> {
    return this.delete(id);
  }

  async getMembers(tenantId: string): Promise<TenantMembership[]> {
    if (!tenantId) {
      console.warn('[TenantsService] Warning: tenantId is missing in getMembers');
      throw new BadRequestException('Tenant ID is required');
    }
    return this.getTenantMembers(tenantId);
  }

  async listTenantMemberships(tenantId: string): Promise<TenantMembership[]> {
    if (!tenantId) {
      console.warn('[TenantsService] Warning: tenantId is missing in listTenantMemberships');
      throw new BadRequestException('Tenant ID is required');
    }
    return this.getTenantMembers(tenantId);
  }

  async updateTenantMembership(membershipId: string, role: string): Promise<TenantMembership> {
    const membership = await this.tenantMembershipRepository.findOne({
      where: { id: membershipId },
    });
    if (!membership) {
      throw new NotFoundException('Tenant membership not found');
    }
    membership.role = role;
    return this.tenantMembershipRepository.save(membership);
  }

  async inviteMember(tenantId: string, dto: any): Promise<TenantInvitation> {
    if (!tenantId) {
      console.warn('[TenantsService] Warning: tenantId is missing in inviteMember');
      throw new BadRequestException('Tenant ID is required');
    }
    return this.inviteUserToTenant(tenantId, dto.invitedBy, dto.email, dto.role);
  }

  async updateMemberRole(tenantId: string, userId: string, dto: any): Promise<TenantMembership> {
    if (!tenantId) {
      console.warn('[TenantsService] Warning: tenantId is missing in updateMemberRole');
      throw new BadRequestException('Tenant ID is required');
    }
    const membership = await this.getUserTenantMembership(userId, tenantId);
    if (!membership) {
      throw new NotFoundException('Tenant membership not found');
    }
    membership.role = dto.role;
    return this.tenantMembershipRepository.save(membership);
  }

  async removeMember(tenantId: string, userId: string): Promise<void> {
    if (!tenantId) {
      console.warn('[TenantsService] Warning: tenantId is missing in removeMember');
      throw new BadRequestException('Tenant ID is required');
    }
    return this.removeUserFromTenant(userId, tenantId);
  }

  /**
   * Get tenant-specific settings
   * @param id Tenant ID
   * @returns Tenant settings object
   */
  async getTenantSettings(id: string): Promise<any> {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant.settings || {};
  }

  /**
   * Update tenant-specific settings
   * @param id Tenant ID
   * @param settings Settings object to update
   * @returns Updated tenant settings
   */
  async updateTenantSettings(id: string, settings: any): Promise<any> {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    tenant.settings = {
      ...(tenant.settings || {}),
      ...settings
    };
    await this.tenantRepository.save(tenant);
    return tenant.settings;
  }
}