import { Repository } from 'typeorm';
import { TenantInvitation } from '../../tenants/entities/tenant-invitation.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
export declare function seedOrganizationInvitations(invitationRepository: Repository<TenantInvitation>, userRepository: Repository<User>, tenantRepository: Repository<Tenant>): Promise<void>;
