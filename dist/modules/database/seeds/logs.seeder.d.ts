import { Repository } from 'typeorm';
import { Log } from '../../logs/entities/log.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
export declare function seedLogs(logRepository: Repository<Log>, userRepository: Repository<User>, tenantRepository: Repository<Tenant>): Promise<void>;
