import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
export declare class ApiKey {
    id: string;
    userId: string;
    tenantId: string;
    name: string;
    key: string;
    permissions: Record<string, any>;
    expiresAt: Date;
    active: boolean;
    user: User;
    tenant: Tenant;
    createdAt: Date;
    updatedAt: Date;
}
