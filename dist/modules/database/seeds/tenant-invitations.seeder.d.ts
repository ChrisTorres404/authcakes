import { Repository } from 'typeorm';
import { TenantInvitation } from '../../tenants/entities/tenant-invitation.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SeederOptions } from './seeder.service';
export declare function seedTenantInvitations(invitationRepository: Repository<TenantInvitation>, userRepository: Repository<User>, tenantRepository: Repository<Tenant>, options?: SeederOptions): Promise<void>;
