import { Repository } from 'typeorm';
import { Log } from '../../logs/entities/log.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SeederOptions } from './seeder.service';
export declare function seedLogs(logRepository: Repository<Log>, userRepository: Repository<User>, tenantRepository: Repository<Tenant>, options?: SeederOptions): Promise<void>;
