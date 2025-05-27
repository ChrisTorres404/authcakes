import { Repository } from 'typeorm';
import { TenantMembership } from '../../tenants/entities/tenant-membership.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SeederOptions } from './seeder.service';
export declare function seedTenantMemberships(tenantMembershipRepository: Repository<TenantMembership>, userRepository: Repository<User>, tenantRepository: Repository<Tenant>, options?: SeederOptions): Promise<void>;
