import { User } from '../../users/entities/user.entity';
import { Tenant } from './tenant.entity';
export declare class TenantMembership {
    id: string;
    userId: string;
    tenantId: string;
    role: string;
    user: User;
    tenant: Tenant;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
