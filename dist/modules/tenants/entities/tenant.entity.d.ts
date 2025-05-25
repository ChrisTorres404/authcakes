import { TenantMembership } from './tenant-membership.entity';
import { ApiKey } from '../../api/entities/api-key.entity';
import { TenantInvitation } from './tenant-invitation.entity';
import { Log } from '../../logs/entities/log.entity';
export declare class Tenant {
    id: string;
    name: string;
    slug: string;
    logo: string;
    active: boolean;
    settings: Record<string, any>;
    memberships: TenantMembership[];
    apiKeys: ApiKey[];
    invitations: TenantInvitation[];
    logs: Log[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
