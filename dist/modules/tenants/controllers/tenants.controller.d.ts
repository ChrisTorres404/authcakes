import { TenantsService } from '../services/tenants.service';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { AddUserToTenantDto } from '../dto/add-user-to-tenant.dto';
import { UpdateTenantMembershipDto } from '../dto/update-tenant-membership.dto';
import { TenantResponseDto } from '../dto/tenant-response.dto';
import { ApiResponseDto } from '../dto/api-response.dto';
import { Tenant } from '../entities/tenant.entity';
import { InviteTenantMemberDto, UpdateTenantMemberRoleDto } from '../dto/tenant-member.dto';
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    createTenant(dto: CreateTenantDto): Promise<ApiResponseDto<TenantResponseDto>>;
    listTenants(): Promise<ApiResponseDto<TenantResponseDto[]>>;
    getTenantById(id: string): Promise<ApiResponseDto<TenantResponseDto>>;
    updateTenant(id: string, dto: UpdateTenantDto): Promise<Tenant>;
    deleteTenant(id: string): Promise<{
        success: boolean;
    }>;
    listTenantMemberships(tenantId: string): Promise<import("../entities/tenant-membership.entity").TenantMembership[]>;
    addUserToTenant(tenantId: string, dto: AddUserToTenantDto): Promise<import("../entities/tenant-membership.entity").TenantMembership>;
    updateTenantMembership(membershipId: string, dto: UpdateTenantMembershipDto): Promise<import("../entities/tenant-membership.entity").TenantMembership>;
    removeUserFromTenant(tenantId: string, userId: string): Promise<{
        success: boolean;
    }>;
    getSettings(id: string): Promise<any>;
    updateSettings(id: string, settings: any): Promise<any>;
    getMembers(tenantId: string): Promise<import("../entities/tenant-membership.entity").TenantMembership[]>;
    inviteMember(tenantId: string, dto: InviteTenantMemberDto): Promise<import("../entities/tenant-invitation.entity").TenantInvitation>;
    updateMemberRole(tenantId: string, userId: string, dto: UpdateTenantMemberRoleDto): Promise<import("../entities/tenant-membership.entity").TenantMembership>;
    removeMember(tenantId: string, userId: string): Promise<void>;
}
