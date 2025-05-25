import { User } from '../../users/entities/user.entity';
import { Tenant } from './tenant.entity';
export declare class TenantInvitation {
    id: string;
    tenantId: string;
    invitedBy: string;
    email: string;
    role: string;
    token: string;
    expiresAt: Date;
    acceptedAt: Date;
    acceptedBy: string;
    tenant: Tenant;
    inviter: User;
    acceptor: User;
    createdAt: Date;
    updatedAt: Date;
}
