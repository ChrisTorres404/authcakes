"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TenantsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto = require("crypto");
const tenant_entity_1 = require("../entities/tenant.entity");
const tenant_membership_entity_1 = require("../entities/tenant-membership.entity");
const tenant_invitation_entity_1 = require("../entities/tenant-invitation.entity");
let TenantsService = TenantsService_1 = class TenantsService {
    tenantRepository;
    tenantMembershipRepository;
    tenantInvitationRepository;
    logger = new common_1.Logger(TenantsService_1.name);
    constructor(tenantRepository, tenantMembershipRepository, tenantInvitationRepository) {
        this.tenantRepository = tenantRepository;
        this.tenantMembershipRepository = tenantMembershipRepository;
        this.tenantInvitationRepository = tenantInvitationRepository;
    }
    async create(data) {
        if (data.slug) {
            const existingTenant = await this.tenantRepository.findOne({
                where: { slug: data.slug },
            });
            if (existingTenant) {
                throw new common_1.ConflictException('A tenant with this slug already exists');
            }
        }
        const tenant = this.tenantRepository.create(data);
        return this.tenantRepository.save(tenant);
    }
    async findAll() {
        return this.tenantRepository.find({
            where: { active: true },
        });
    }
    async findById(id) {
        const tenant = await this.tenantRepository.findOne({
            where: { id },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        return tenant;
    }
    async findBySlug(slug) {
        const tenant = await this.tenantRepository.findOne({
            where: { slug, active: true },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        return tenant;
    }
    async update(id, data) {
        const tenant = await this.findById(id);
        if (data.slug && data.slug !== tenant.slug) {
            const existingTenant = await this.tenantRepository.findOne({
                where: { slug: data.slug },
            });
            if (existingTenant) {
                throw new common_1.ConflictException('A tenant with this slug already exists');
            }
        }
        Object.assign(tenant, data);
        return this.tenantRepository.save(tenant);
    }
    async delete(id) {
        const tenant = await this.findById(id);
        await this.tenantRepository.remove(tenant);
    }
    async softDelete(id) {
        const tenant = await this.findById(id);
        tenant.active = false;
        await this.tenantRepository.save(tenant);
    }
    async addUserToTenant(userId, tenantId, role = 'member') {
        const existingMembership = await this.tenantMembershipRepository.findOne({
            where: { userId, tenantId },
        });
        if (existingMembership) {
            throw new common_1.ConflictException('User is already a member of this tenant');
        }
        await this.findById(tenantId);
        const membership = this.tenantMembershipRepository.create({
            userId,
            tenantId,
            role,
        });
        return this.tenantMembershipRepository.save(membership);
    }
    async getUserTenantMembership(userId, tenantId) {
        if (!tenantId) {
            console.warn('[TenantsService] Warning: tenantId is missing in getUserTenantMembership');
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        return this.tenantMembershipRepository.findOne({
            where: { userId, tenantId },
            relations: ['tenant'],
        });
    }
    async getUserTenantMemberships(userId) {
        return this.tenantMembershipRepository.find({
            where: { userId },
            relations: ['tenant'],
        });
    }
    async updateUserTenantRole(userId, tenantId, role) {
        if (!tenantId) {
            console.warn('[TenantsService] Warning: tenantId is missing in updateUserTenantRole');
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        const membership = await this.tenantMembershipRepository.findOne({
            where: { userId, tenantId },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Tenant membership not found');
        }
        membership.role = role;
        return this.tenantMembershipRepository.save(membership);
    }
    async removeUserFromTenant(userId, tenantId) {
        if (!tenantId) {
            console.warn('[TenantsService] Warning: tenantId is missing in removeUserFromTenant');
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        const membership = await this.tenantMembershipRepository.findOne({
            where: { userId, tenantId },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Tenant membership not found');
        }
        await this.tenantMembershipRepository.remove(membership);
    }
    async getTenantMembers(tenantId) {
        if (!tenantId) {
            console.warn('[TenantsService] Warning: tenantId is missing in getTenantMembers');
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        return this.tenantMembershipRepository.find({
            where: { tenantId },
            relations: ['user'],
        });
    }
    async inviteUserToTenant(tenantId, invitedBy, email, role = 'member') {
        await this.findById(tenantId);
        const existingInvitation = await this.tenantInvitationRepository.findOne({
            where: {
                tenantId,
                email,
                acceptedAt: (0, typeorm_2.IsNull)(),
            },
        });
        if (existingInvitation) {
            throw new common_1.ConflictException('An invitation has already been sent to this email');
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
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
    async getInvitationByToken(token) {
        const invitation = await this.tenantInvitationRepository.findOne({
            where: { token },
            relations: ['tenant'],
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        if (invitation.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Invitation has expired');
        }
        if (invitation.acceptedAt) {
            throw new common_1.BadRequestException('Invitation has already been accepted');
        }
        return invitation;
    }
    async acceptInvitation(token, userId) {
        const invitation = await this.getInvitationByToken(token);
        const existingMembership = await this.tenantMembershipRepository.findOne({
            where: { userId, tenantId: invitation.tenantId },
        });
        if (existingMembership) {
            throw new common_1.ConflictException('User is already a member of this tenant');
        }
        invitation.acceptedAt = new Date();
        invitation.acceptedBy = userId;
        await this.tenantInvitationRepository.save(invitation);
        return this.addUserToTenant(userId, invitation.tenantId, invitation.role);
    }
    async getTenantInvitations(tenantId) {
        if (!tenantId) {
            console.warn('[TenantsService] Warning: tenantId is missing in getTenantInvitations');
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        return this.tenantInvitationRepository.find({
            where: { tenantId, acceptedAt: (0, typeorm_2.IsNull)() },
            relations: ['tenant'],
        });
    }
    async cancelInvitation(id) {
        const invitation = await this.tenantInvitationRepository.findOne({
            where: { id },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        await this.tenantInvitationRepository.remove(invitation);
    }
    async createTenant(data) {
        return this.create(data);
    }
    async getTenantById(id) {
        return this.findById(id);
    }
    async listTenants(params) {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 10;
        const search = params?.search;
        const query = this.tenantRepository.createQueryBuilder('tenant').where('tenant.active = :active', { active: true });
        if (search) {
            query.andWhere('tenant.name ILIKE :search OR tenant.slug ILIKE :search', { search: `%${search}%` });
        }
        query.skip((page - 1) * limit).take(limit);
        return query.getMany();
    }
    async updateTenant(id, data) {
        return this.update(id, data);
    }
    async deleteTenant(id) {
        return this.delete(id);
    }
    async getMembers(tenantId) {
        if (!tenantId) {
            console.warn('[TenantsService] Warning: tenantId is missing in getMembers');
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        return this.getTenantMembers(tenantId);
    }
    async listTenantMemberships(tenantId) {
        if (!tenantId) {
            console.warn('[TenantsService] Warning: tenantId is missing in listTenantMemberships');
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        return this.getTenantMembers(tenantId);
    }
    async updateTenantMembership(membershipId, role) {
        const membership = await this.tenantMembershipRepository.findOne({
            where: { id: membershipId },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Tenant membership not found');
        }
        membership.role = role;
        return this.tenantMembershipRepository.save(membership);
    }
    async inviteMember(tenantId, dto) {
        if (!tenantId) {
            console.warn('[TenantsService] Warning: tenantId is missing in inviteMember');
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        return this.inviteUserToTenant(tenantId, dto.invitedBy, dto.email, dto.role);
    }
    async updateMemberRole(tenantId, userId, dto) {
        if (!tenantId) {
            console.warn('[TenantsService] Warning: tenantId is missing in updateMemberRole');
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        const membership = await this.getUserTenantMembership(userId, tenantId);
        if (!membership) {
            throw new common_1.NotFoundException('Tenant membership not found');
        }
        membership.role = dto.role;
        return this.tenantMembershipRepository.save(membership);
    }
    async removeMember(tenantId, userId) {
        if (!tenantId) {
            console.warn('[TenantsService] Warning: tenantId is missing in removeMember');
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        return this.removeUserFromTenant(userId, tenantId);
    }
    async getTenantSettings(id) {
        const tenant = await this.findById(id);
        if (!tenant) {
            throw new common_1.NotFoundException(`Tenant with ID ${id} not found`);
        }
        return tenant.settings || {};
    }
    async updateTenantSettings(id, settings) {
        const tenant = await this.findById(id);
        if (!tenant) {
            throw new common_1.NotFoundException(`Tenant with ID ${id} not found`);
        }
        tenant.settings = {
            ...(tenant.settings || {}),
            ...settings
        };
        await this.tenantRepository.save(tenant);
        return tenant.settings;
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = TenantsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __param(1, (0, typeorm_1.InjectRepository)(tenant_membership_entity_1.TenantMembership)),
    __param(2, (0, typeorm_1.InjectRepository)(tenant_invitation_entity_1.TenantInvitation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map