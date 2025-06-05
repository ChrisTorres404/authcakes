export interface SeedUser {
    email: string;
    password: string;
    role: string;
    active: boolean;
    firstName?: string;
    lastName?: string;
    emailVerified: boolean;
    mfaEnabled?: boolean;
    failedLoginAttempts?: number;
}
export interface SeedTenant {
    name: string;
    slug: string;
    active: boolean;
    settings?: Record<string, any>;
}
export interface SeedTenantMembership {
    userEmail: string;
    tenantSlug: string;
    role: string;
}
export interface SeedSystemSetting {
    key: string;
    value: string;
    type: string;
    description?: string;
}
export interface SeedApiKey {
    name: string;
    userEmail: string;
    tenantSlug?: string;
    permissions: Record<string, any>;
    active: boolean;
}
export interface SeedDataConfig {
    environment: 'development' | 'test' | 'production';
    systemSettings: SeedSystemSetting[];
    users: SeedUser[];
    tenants: SeedTenant[];
    tenantMemberships: SeedTenantMembership[];
    apiKeys?: SeedApiKey[];
    includeDemoData: boolean;
}
