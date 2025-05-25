import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
export declare class Log {
    id: string;
    userId: string;
    tenantId: string;
    action: string;
    ip: string;
    userAgent: string;
    details: Record<string, any>;
    timestamp: Date;
    user: User;
    tenant: Tenant;
}
