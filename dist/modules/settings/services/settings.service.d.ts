import { Repository } from 'typeorm';
import { SystemSetting } from '../entities/system-setting.entity';
type SettingType = 'string' | 'number' | 'boolean' | 'json';
interface SettingValue<T> {
    key: string;
    value: T;
    type?: SettingType;
    description?: string;
}
interface SessionSettings {
    globalTimeoutMinutes: number;
    warningTimeSeconds: number;
    showWarning: boolean;
    redirectUrl: string;
    warningMessage: string;
    maxSessionsPerUser: number;
    enforceSingleSession: boolean;
}
interface AuthSettings {
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
}
interface ProfileSettings {
    allowUserProfileUpdate: boolean;
    profileUpdatableFields: string[];
}
interface TokenSettings {
    refreshTokenDuration: number;
    accessTokenDuration: number;
}
export declare class SettingsService {
    private readonly systemSettingsRepository;
    private readonly logger;
    constructor(systemSettingsRepository: Repository<SystemSetting>);
    findAll(): Promise<SystemSetting[]>;
    findByKey(key: string): Promise<SystemSetting | null>;
    getValue<T>(key: string, defaultValue?: T): Promise<T>;
    setValue<T>(key: string, value: T, type?: SettingType, description?: string): Promise<SystemSetting>;
    getSessionTimeoutSettings(): Promise<SessionSettings>;
    getAuthenticationSettings(): Promise<AuthSettings>;
    getProfileSettings(): Promise<ProfileSettings>;
    getTokenSettings(): Promise<TokenSettings>;
    upsertBulkSettings<T>(settings: SettingValue<T>[]): Promise<SystemSetting[]>;
    delete(key: string): Promise<boolean>;
}
export {};
