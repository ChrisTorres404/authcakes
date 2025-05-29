import { TenantRole } from './tenant-invitation.dto';
export declare class InviteTenantMemberDto {
    email: string;
    role: TenantRole;
    invitedBy: string;
}
export declare class UpdateTenantMemberRoleDto {
    role: TenantRole;
}
