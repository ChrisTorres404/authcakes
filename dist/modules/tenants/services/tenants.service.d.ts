import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { TenantMembership } from '../entities/tenant-membership.entity';
import { TenantInvitation } from '../entities/tenant-invitation.entity';
import { TenantRole } from '../dto/tenant-invitation.dto';
interface CreateTenantDto {
    name: string;
    slug?: string;
    logo?: string;
    active?: boolean;
    settings?: TenantSettings;
}
interface UpdateTenantDto {
    name?: string;
    slug?: string;
    logo?: string;
    active?: boolean;
    settings?: TenantSettings;
}
interface ListTenantsParams {
    page?: number;
    limit?: number;
    search?: string;
}
interface TenantSettings {
    branding?: {
        primaryColor?: string;
        secondaryColor?: string;
        logo?: string;
    };
    security?: {
        mfaEnabled?: boolean;
        passwordPolicy?: {
            minLength: number;
            requireUppercase: boolean;
            requireNumbers: boolean;
            requireSpecial: boolean;
        };
    };
    features?: Record<string, boolean>;
    customFields?: Record<string, unknown>;
}
interface UpdateMemberRoleDto {
    role: TenantRole;
}
interface InviteMemberDto {
    email: string;
    role: TenantRole;
    invitedBy: string;
}
export declare class TenantsService {
    private readonly tenantRepository;
    private readonly tenantMembershipRepository;
    private readonly tenantInvitationRepository;
    private readonly logger;
    constructor(tenantRepository: Repository<Tenant>, tenantMembershipRepository: Repository<TenantMembership>, tenantInvitationRepository: Repository<TenantInvitation>);
    create(data: CreateTenantDto): Promise<Tenant>;
    findAll(): Promise<Tenant[]>;
    findById(id: string): Promise<Tenant>;
    findBySlug(slug: string): Promise<Tenant>;
    update(id: string, data: UpdateTenantDto): Promise<Tenant>;
    delete(id: string): Promise<void>;
    softDelete(id: string): Promise<void>;
    addUserToTenant(userId: string, tenantId: string, role?: TenantRole): Promise<TenantMembership>;
    getUserTenantMembership(userId: string, tenantId: string): Promise<TenantMembership | null>;
    getUserTenantMemberships(userId: string): Promise<TenantMembership[]>;
    updateUserTenantRole(userId: string, tenantId: string, role: TenantRole): Promise<TenantMembership>;
    removeUserFromTenant(userId: string, tenantId: string): Promise<void>;
    getTenantMembers(tenantId: string): Promise<TenantMembership[]>;
    inviteUserToTenant(tenantId: string, invitedBy: string, email: string, role?: TenantRole): Promise<TenantInvitation>;
    getInvitationByToken(token: string): Promise<TenantInvitation>;
    acceptInvitation(token: string, userId: string): Promise<TenantMembership>;
    getTenantInvitations(tenantId: string): Promise<TenantInvitation[]>;
    cancelInvitation(id: string): Promise<void>;
    createTenant(data: CreateTenantDto): Promise<Tenant>;
    getTenantById(id: string): Promise<Tenant>;
    listTenants(params?: ListTenantsParams): Promise<Tenant[]>;
    updateTenant(id: string, data: UpdateTenantDto): Promise<Tenant>;
    deleteTenant(id: string): Promise<void>;
    getMembers(tenantId: string): Promise<TenantMembership[]>;
    listTenantMemberships(tenantId: string): Promise<TenantMembership[]>;
    updateTenantMembership(membershipId: string, role: TenantRole): Promise<TenantMembership>;
    inviteMember(tenantId: string, dto: InviteMemberDto): Promise<TenantInvitation>;
    updateMemberRole(tenantId: string, userId: string, dto: UpdateMemberRoleDto): Promise<TenantMembership>;
    removeMember(tenantId: string, userId: string): Promise<void>;
    getTenantSettings(id: string): Promise<TenantSettings>;
    updateTenantSettings(id: string, settings: Partial<TenantSettings>): Promise<TenantSettings>;
}
export {};
