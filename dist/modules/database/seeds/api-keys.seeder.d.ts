import { Repository } from 'typeorm';
import { ApiKey } from '../../api/entities/api-key.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SeederOptions } from './seeder.service';
export declare function seedApiKeys(apiKeyRepository: Repository<ApiKey>, userRepository: Repository<User>, tenantRepository: Repository<Tenant>, options?: SeederOptions): Promise<void>;
