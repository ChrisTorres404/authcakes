import { User } from '../../users/entities/user.entity';
import { Tenant } from './tenant.entity';
import { TenantRole } from '../dto/tenant-invitation.dto';
export declare class TenantInvitation {
    id: string;
    tenantId: string;
    invitedBy: string;
    email: string;
    role: TenantRole;
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
