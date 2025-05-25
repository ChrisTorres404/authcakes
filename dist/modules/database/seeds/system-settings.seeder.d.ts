import { Repository } from 'typeorm';
import { SystemSetting } from '../../settings/entities/system-setting.entity';
export declare function seedSystemSettings(systemSettingsRepository: Repository<SystemSetting>): Promise<void>;
