import { Repository } from 'typeorm';
import { SystemSetting } from '../entities/system-setting.entity';
export declare class SettingsService {
    private readonly systemSettingsRepository;
    private readonly logger;
    constructor(systemSettingsRepository: Repository<SystemSetting>);
    findAll(): Promise<SystemSetting[]>;
    findByKey(key: string): Promise<SystemSetting | null>;
    getValue<T>(key: string, defaultValue?: T): Promise<T>;
    setValue(key: string, value: any, type?: string, description?: string): Promise<SystemSetting>;
    getSessionTimeoutSettings(): Promise<{
        globalTimeoutMinutes: number;
        warningTimeSeconds: number;
        showWarning: boolean;
        redirectUrl: string;
        warningMessage: string;
        maxSessionsPerUser: number;
        enforceSingleSession: boolean;
    }>;
    getAuthenticationSettings(): Promise<{
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
    upsertBulkSettings(settings: Array<{
        key: string;
        value: any;
        type?: string;
        description?: string;
    }>): Promise<any[]>;
    delete(key: string): Promise<boolean>;
}
