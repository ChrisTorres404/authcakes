import { SettingsService } from '../services/settings.service';
import { SystemSetting } from '../entities/system-setting.entity';
import { CreateSettingDto } from '../dto/create-setting.dto';
import { UpdateSettingDto } from '../dto/update-setting.dto';
import { SessionSettingsDto } from '../dto/session-settings.dto';
import { AuthSettingsDto } from '../dto/auth-settings.dto';
import { TokenSettingsDto } from '../dto/token-settings.dto';
import { ProfileSettingsDto } from '../dto/profile-settings.dto';
import { BulkSettingDto } from '../dto/bulk-setting.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    findAll(): Promise<SystemSetting[]>;
    findOne(key: string): Promise<SystemSetting>;
    create(createSettingDto: CreateSettingDto): Promise<SystemSetting>;
    update(key: string, updateSettingDto: UpdateSettingDto): Promise<SystemSetting>;
    remove(key: string): Promise<{
        success: boolean;
    }>;
    getSessionSettings(): Promise<SessionSettingsDto>;
    getAuthSettings(): Promise<AuthSettingsDto>;
    getTokenSettings(): Promise<TokenSettingsDto>;
    getProfileSettings(): Promise<ProfileSettingsDto>;
    upsertBulkSettings(settings: BulkSettingDto[]): Promise<SystemSetting[]>;
}
