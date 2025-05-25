import { Repository } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
export declare function seedTenants(tenantRepository: Repository<Tenant>): Promise<void>;
