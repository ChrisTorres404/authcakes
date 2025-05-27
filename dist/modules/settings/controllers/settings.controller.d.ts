import { SettingsService } from '../services/settings.service';
import { SystemSetting } from '../entities/system-setting.entity';
import { CreateSettingDto } from '../dto/create-setting.dto';
import { UpdateSettingDto } from '../dto/update-setting.dto';
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
    getSessionSettings(): Promise<{
        globalTimeoutMinutes: number;
        warningTimeSeconds: number;
        showWarning: boolean;
        redirectUrl: string;
        warningMessage: string;
        maxSessionsPerUser: number;
        enforceSingleSession: boolean;
    }>;
    getAuthSettings(): Promise<{
        enableEmailAuth: boolean;
        enableSmsAuth: boolean;
        enableGoogleAuth: boolean;
        enableAppleAuth: boolean;
        enableMfa: boolean;
        enableWebauthn: boolean;
        passwordMinLength: number;
        passwordRequireUppercase: boolean;
        passwordRequireLowercase: boolean;
        passwordRequireNumber: boolean;
        passwordRequireSpecial: boolean;
        maxLoginAttempts: number;
        loginLockoutDuration: number;
    }>;
    getTokenSettings(): Promise<{
        refreshTokenDuration: number;
        accessTokenDuration: number;
    }>;
    upsertBulkSettings(settings: BulkSettingDto[]): Promise<SystemSetting[]>;
}
