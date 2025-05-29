import { TenantsService } from '../services/tenants.service';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { AddUserToTenantDto } from '../dto/add-user-to-tenant.dto';
import { UpdateTenantMembershipDto } from '../dto/update-tenant-membership.dto';
import { TenantResponseDto } from '../dto/tenant-response.dto';
import { ApiResponseDto } from '../dto/api-response.dto';
import { InviteTenantMemberDto, UpdateTenantMemberRoleDto } from '../dto/tenant-member.dto';
import { SuccessResponseDto } from '../dto/success-response.dto';
import { TenantMembershipDto } from '../dto/tenant-membership.dto';
import { TenantInvitationDto } from '../dto/tenant-invitation.dto';
export type TenantTheme = 'light' | 'dark' | 'system';
export interface TenantSettings {
    timezone?: string;
    theme?: TenantTheme;
    dateFormat?: string;
    notifications?: {
        email?: boolean;
        push?: boolean;
        slack?: boolean;
    };
    features?: Record<string, boolean>;
    customization?: Record<string, string>;
}
export declare class TenantSettingsDto {
    settings: TenantSettings;
}
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    createTenant(dto: CreateTenantDto): Promise<ApiResponseDto<TenantResponseDto>>;
    listTenants(page?: number, limit?: number, search?: string): Promise<ApiResponseDto<TenantResponseDto[]>>;
    getTenantById(id: string): Promise<ApiResponseDto<TenantResponseDto>>;
    updateTenant(id: string, dto: UpdateTenantDto): Promise<SuccessResponseDto>;
    deleteTenant(id: string): Promise<SuccessResponseDto>;
    addUserToTenant(tenantId: string, dto: AddUserToTenantDto): Promise<ApiResponseDto<TenantMembershipDto>>;
    updateTenantMembership(membershipId: string, dto: UpdateTenantMembershipDto): Promise<ApiResponseDto<TenantMembershipDto>>;
    removeMember(tenantId: string, userId: string): Promise<{
        success: boolean;
    }>;
    getSettings(id: string): Promise<ApiResponseDto<TenantSettingsDto>>;
    updateSettings(id: string, dto: TenantSettingsDto): Promise<ApiResponseDto<TenantSettingsDto>>;
    getMembers(tenantId: string): Promise<ApiResponseDto<TenantMembershipDto[]>>;
    inviteMember(tenantId: string, dto: InviteTenantMemberDto): Promise<ApiResponseDto<TenantInvitationDto>>;
    updateMemberRole(tenantId: string, userId: string, dto: UpdateTenantMemberRoleDto): Promise<ApiResponseDto<TenantMembershipDto>>;
}
