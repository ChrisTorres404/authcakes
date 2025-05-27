import { Repository } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SeederOptions } from './seeder.service';
export declare function seedTenants(tenantRepository: Repository<Tenant>, options?: SeederOptions): Promise<void>;
