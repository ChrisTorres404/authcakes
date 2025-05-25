export declare enum TenantRole {
    ADMIN = "admin",
    MEMBER = "member",
    VIEWER = "viewer"
}
export declare class AddUserToTenantDto {
    userId: string;
    role: TenantRole;
}
