export declare enum TenantRole {
    ADMIN = "admin",
    MEMBER = "member",
    VIEWER = "viewer"
}
export declare class TenantInvitationDto {
    id: string;
    tenantId: string;
    invitedBy: string;
    email: string;
    role: TenantRole;
    token: string;
    expiresAt: string;
    acceptedAt?: string;
    acceptedBy?: string;
    createdAt: string;
    updatedAt: string;
}
