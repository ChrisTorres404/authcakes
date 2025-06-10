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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsController = exports.TenantSettingsDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tenants_service_1 = require("../services/tenants.service");
const create_tenant_dto_1 = require("../dto/create-tenant.dto");
const update_tenant_dto_1 = require("../dto/update-tenant.dto");
const add_user_to_tenant_dto_1 = require("../dto/add-user-to-tenant.dto");
const update_tenant_membership_dto_1 = require("../dto/update-tenant-membership.dto");
const tenant_roles_decorator_1 = require("../../../common/decorators/tenant-roles.decorator");
const tenant_auth_guard_1 = require("../../../common/guards/tenant-auth.guard");
const tenant_response_dto_1 = require("../dto/tenant-response.dto");
const api_response_dto_1 = require("../dto/api-response.dto");
const tenant_member_dto_1 = require("../dto/tenant-member.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const success_response_dto_1 = require("../dto/success-response.dto");
const swagger_generic_response_decorator_1 = require("../../../common/decorators/swagger-generic-response.decorator");
const tenant_membership_dto_1 = require("../dto/tenant-membership.dto");
const swagger_2 = require("@nestjs/swagger");
const tenant_invitation_dto_1 = require("../dto/tenant-invitation.dto");
function toTenantMembershipDto(membership) {
    return {
        id: membership.id,
        userId: membership.userId,
        tenantId: membership.tenantId,
        role: membership.role,
        createdAt: membership.createdAt.toISOString(),
        updatedAt: membership.updatedAt.toISOString(),
        deletedAt: membership.deletedAt?.toISOString(),
    };
}
function toTenantInvitationDto(invitation) {
    return {
        id: invitation.id,
        tenantId: invitation.tenantId,
        invitedBy: invitation.invitedBy,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        expiresAt: invitation.expiresAt.toISOString(),
        acceptedAt: invitation.acceptedAt?.toISOString(),
        acceptedBy: invitation.acceptedBy,
        createdAt: invitation.createdAt.toISOString(),
        updatedAt: invitation.updatedAt.toISOString(),
    };
}
class TenantSettingsDto {
    settings;
}
exports.TenantSettingsDto = TenantSettingsDto;
__decorate([
    (0, swagger_2.ApiProperty)({
        description: 'Tenant settings configuration',
        example: { timezone: 'UTC', theme: 'dark' },
    }),
    __metadata("design:type", Object)
], TenantSettingsDto.prototype, "settings", void 0);
function toTenantResponseDto(tenant) {
    return {
        ...tenant,
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt.toISOString(),
    };
}
let TenantsController = class TenantsController {
    tenantsService;
    constructor(tenantsService) {
        this.tenantsService = tenantsService;
    }
    async createTenant(dto) {
        try {
            const tenant = await this.tenantsService.createTenant(dto);
            return {
                success: true,
                data: toTenantResponseDto(tenant),
                message: 'Tenant created successfully.',
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create tenant';
            throw new common_1.BadRequestException({
                success: false,
                statusCode: 400,
                error: 'Bad Request',
                message: errorMessage,
                errorCode: 'TENANT_CREATE_FAILED',
            });
        }
    }
    async listTenants(page = 1, limit = 10, search) {
        const tenants = await this.tenantsService.listTenants({
            page,
            limit,
            search,
        });
        return { success: true, data: tenants.map(toTenantResponseDto) };
    }
    async getTenantById(id) {
        try {
            const tenant = await this.tenantsService.getTenantById(id);
            return {
                success: true,
                data: toTenantResponseDto(tenant),
                message: 'Tenant fetched successfully.',
            };
        }
        catch (error) {
            throw new common_1.NotFoundException({
                success: false,
                statusCode: 404,
                error: 'Not Found',
                message: error instanceof Error ? error.message : 'Tenant not found',
                errorCode: 'TENANT_NOT_FOUND',
            });
        }
    }
    async updateTenant(id, dto) {
        await this.tenantsService.updateTenant(id, dto);
        return { success: true };
    }
    async deleteTenant(id) {
        await this.tenantsService.deleteTenant(id);
        return { success: true };
    }
    async addUserToTenant(tenantId, dto) {
        if (!tenantId) {
            console.warn('[TenantsController] Warning: tenantId is missing in addUserToTenant');
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        const membership = await this.tenantsService.addUserToTenant(tenantId, dto.userId, dto.role);
        return { success: true, data: toTenantMembershipDto(membership) };
    }
    async updateTenantMembership(membershipId, dto) {
        const updatedMembership = await this.tenantsService.updateTenantMembership(membershipId, dto.role);
        return { success: true, data: toTenantMembershipDto(updatedMembership) };
    }
    async removeMember(tenantId, userId) {
        if (!tenantId) {
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        await this.tenantsService.removeMember(tenantId, userId);
        return { success: true };
    }
    async getSettings(id) {
        const settings = await this.tenantsService.getTenantSettings(id);
        return { success: true, data: { settings } };
    }
    async updateSettings(id, dto) {
        const updatedSettings = await this.tenantsService.updateTenantSettings(id, dto.settings);
        return { success: true, data: { settings: updatedSettings } };
    }
    async getMembers(tenantId) {
        if (!tenantId) {
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        const members = await this.tenantsService.getMembers(tenantId);
        return { success: true, data: members.map(toTenantMembershipDto) };
    }
    async inviteMember(tenantId, dto) {
        if (!tenantId) {
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        const invitation = await this.tenantsService.inviteMember(tenantId, dto);
        return { success: true, data: toTenantInvitationDto(invitation) };
    }
    async updateMemberRole(tenantId, userId, dto) {
        if (!tenantId) {
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        const updatedMembership = await this.tenantsService.updateMemberRole(tenantId, userId, dto);
        return { success: true, data: toTenantMembershipDto(updatedMembership) };
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a new tenant' }),
    (0, swagger_1.ApiOkResponse)({
        type: api_response_dto_1.ApiResponseDto,
        description: 'Tenant created successfully.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        type: api_response_dto_1.ApiErrorResponseDto,
        description: 'Bad request error.',
    }),
    (0, swagger_1.ApiBody)({ type: create_tenant_dto_1.CreateTenantDto }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tenant_dto_1.CreateTenantDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "createTenant", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List all tenants' }),
    (0, swagger_1.ApiOkResponse)({ type: api_response_dto_1.ApiResponseDto, description: 'List of tenants.' }),
    (0, swagger_1.ApiBadRequestResponse)({
        type: api_response_dto_1.ApiErrorResponseDto,
        description: 'Bad request error.',
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'Forbidden.' }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        type: Number,
        description: 'Page number for pagination (default: 1)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Number of items per page (default: 10)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: 'Search term for tenant name or other fields',
    }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "listTenants", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get tenant by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    (0, swagger_generic_response_decorator_1.ApiResponseWithData)(tenant_response_dto_1.TenantResponseDto),
    (0, swagger_1.ApiNotFoundResponse)({
        type: api_response_dto_1.ApiErrorResponseDto,
        description: 'Tenant not found.',
    }),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getTenantById", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update tenant' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    (0, swagger_1.ApiBody)({ type: update_tenant_dto_1.UpdateTenantDto }),
    (0, swagger_1.ApiOkResponse)({ type: success_response_dto_1.SuccessResponseDto, description: 'Tenant updated.' }),
    (0, swagger_1.ApiBadRequestResponse)({
        type: api_response_dto_1.ApiErrorResponseDto,
        description: 'Bad request error.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        type: api_response_dto_1.ApiErrorResponseDto,
        description: 'Tenant not found.',
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'Forbidden.' }),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_tenant_dto_1.UpdateTenantDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "updateTenant", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete tenant' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    (0, swagger_1.ApiOkResponse)({ type: success_response_dto_1.SuccessResponseDto, description: 'Tenant deleted.' }),
    (0, swagger_1.ApiBadRequestResponse)({
        type: api_response_dto_1.ApiErrorResponseDto,
        description: 'Bad request error.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        type: api_response_dto_1.ApiErrorResponseDto,
        description: 'Tenant not found.',
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'Forbidden.' }),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "deleteTenant", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Add user to tenant' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    (0, swagger_1.ApiBody)({ type: add_user_to_tenant_dto_1.AddUserToTenantDto }),
    (0, swagger_generic_response_decorator_1.ApiResponseWithData)(tenant_membership_dto_1.TenantMembershipDto),
    (0, common_1.Post)(':id/members'),
    (0, common_1.UseGuards)(tenant_auth_guard_1.TenantAuthGuard),
    (0, tenant_roles_decorator_1.TenantRoles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_user_to_tenant_dto_1.AddUserToTenantDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "addUserToTenant", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update tenant membership role' }),
    (0, swagger_1.ApiParam)({ name: 'membershipId', type: 'string' }),
    (0, swagger_1.ApiBody)({ type: update_tenant_membership_dto_1.UpdateTenantMembershipDto }),
    (0, swagger_generic_response_decorator_1.ApiResponseWithData)(tenant_membership_dto_1.TenantMembershipDto),
    (0, common_1.Patch)('members/:membershipId'),
    (0, common_1.UseGuards)(tenant_auth_guard_1.TenantAuthGuard),
    (0, tenant_roles_decorator_1.TenantRoles)('admin'),
    __param(0, (0, common_1.Param)('membershipId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_tenant_membership_dto_1.UpdateTenantMembershipDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "updateTenantMembership", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Remove user from tenant' }),
    (0, swagger_1.ApiParam)({ name: 'tenantId', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiParam)({ name: 'userId', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiOkResponse)({ type: success_response_dto_1.SuccessResponseDto, description: 'User removed' }),
    (0, common_1.Delete)(':tenantId/members/:userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_auth_guard_1.TenantAuthGuard),
    (0, tenant_roles_decorator_1.TenantRoles)('admin'),
    __param(0, (0, common_1.Param)('tenantId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Get)(':id/settings'),
    (0, common_1.UseGuards)(tenant_auth_guard_1.TenantAuthGuard),
    (0, tenant_roles_decorator_1.TenantRoles)('admin'),
    (0, swagger_generic_response_decorator_1.ApiResponseWithData)(TenantSettingsDto),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Patch)(':id/settings'),
    (0, common_1.UseGuards)(tenant_auth_guard_1.TenantAuthGuard),
    (0, tenant_roles_decorator_1.TenantRoles)('admin'),
    (0, swagger_generic_response_decorator_1.ApiResponseWithData)(TenantSettingsDto),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, TenantSettingsDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)(':tenantId/members'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_auth_guard_1.TenantAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'List all members of a tenant' }),
    (0, swagger_1.ApiParam)({ name: 'tenantId', type: 'string', format: 'uuid' }),
    (0, swagger_generic_response_decorator_1.ApiResponseWithData)(tenant_membership_dto_1.TenantMembershipDto),
    __param(0, (0, common_1.Param)('tenantId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Post)(':tenantId/invite'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_auth_guard_1.TenantAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Invite a user to a tenant' }),
    (0, swagger_1.ApiParam)({ name: 'tenantId', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiBody)({ type: tenant_member_dto_1.InviteTenantMemberDto }),
    (0, swagger_generic_response_decorator_1.ApiResponseWithData)(tenant_invitation_dto_1.TenantInvitationDto),
    __param(0, (0, common_1.Param)('tenantId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, tenant_member_dto_1.InviteTenantMemberDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "inviteMember", null);
__decorate([
    (0, common_1.Patch)(':tenantId/members/:userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_auth_guard_1.TenantAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Update a tenant member role' }),
    (0, swagger_1.ApiParam)({ name: 'tenantId', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiParam)({ name: 'userId', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiBody)({ type: tenant_member_dto_1.UpdateTenantMemberRoleDto }),
    (0, swagger_generic_response_decorator_1.ApiResponseWithData)(tenant_membership_dto_1.TenantMembershipDto),
    __param(0, (0, common_1.Param)('tenantId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, tenant_member_dto_1.UpdateTenantMemberRoleDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "updateMemberRole", null);
exports.TenantsController = TenantsController = __decorate([
    (0, swagger_1.ApiTags)('tenants'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: 'Authentication required or invalid/missing token.',
    }),
    (0, common_1.Controller)('v1/tenants'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService])
], TenantsController);
//# sourceMappingURL=tenants.controller.js.map