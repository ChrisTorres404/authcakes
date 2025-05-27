import { Repository } from 'typeorm';
import { SystemSetting } from '../../settings/entities/system-setting.entity';
import { SeederOptions } from './seeder.service';
export declare function seedSystemSettings(systemSettingsRepository: Repository<SystemSetting>, options?: SeederOptions): Promise<void>;
