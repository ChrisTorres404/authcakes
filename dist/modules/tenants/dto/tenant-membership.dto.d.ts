import { TenantRole } from './tenant-invitation.dto';
export declare class TenantMembershipDto {
    id: string;
    userId: string;
    tenantId: string;
    role: TenantRole;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}
