import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

/**
 * Service for managing system-wide settings
 */

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(SystemSetting)
    private readonly systemSettingsRepository: Repository<SystemSetting>,
  ) {}

  /**
   * Retrieves all system settings
   * @returns Array of all system settings
   */
  async findAll(): Promise<SystemSetting[]> {
    return this.systemSettingsRepository.find();
  }

  /**
   * Finds a setting by its key
   * @param key - Setting key to look up
   * @returns Setting object or null if not found
   */
  async findByKey(key: string): Promise<SystemSetting | null> {
    return this.systemSettingsRepository.findOne({ where: { key } });
  }

  /**
   * Gets a setting value with type conversion
   * @param key - Setting key to retrieve
   * @param defaultValue - Default value if setting not found
   * @returns Setting value converted to type T
   */
  async getValue<T>(key: string, defaultValue?: T): Promise<T> {
    const setting = await this.findByKey(key);

    if (!setting) {
      this.logger.debug(
        `Setting "${key}" not found, using default value: ${String(defaultValue)}`,
      );
      return defaultValue as T;
    }

    try {
      switch (setting.type) {
        case 'number':
          return Number(setting.value) as unknown as T;
        case 'boolean':
          return (setting.value.toLowerCase() === 'true') as unknown as T;
        case 'json':
          return JSON.parse(setting.value) as T;
        default:
          return setting.value as unknown as T;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error parsing setting "${key}" with type "${setting.type}": ${errorMessage}`,
      );
      return defaultValue as T;
    }
  }

  /**
   * Updates or creates a system setting
   * @param key - Setting key
   * @param value - Setting value (will be converted to string)
   * @param type - Value type (default: 'string')
   * @param description - Optional setting description
   * @returns Updated or created setting
   * @throws Error if value cannot be serialized
   */
  async setValue<T>(
    key: string,
    value: T,
    type: SettingType = 'string',
    description?: string,
  ): Promise<SystemSetting> {
    // Convert value to string based on type
    let stringValue: string;

    try {
      if (type === 'json') {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error serializing value for setting "${key}": ${errorMessage}`,
      );
      throw new Error(`Failed to serialize value for setting "${key}"`);
    }

    const setting = await this.findByKey(key);

    if (setting) {
      setting.value = stringValue;
      setting.type = type;

      if (description) {
        setting.description = description;
      }

      return this.systemSettingsRepository.save(setting);
    } else {
      const newSetting = this.systemSettingsRepository.create({
        key,
        value: stringValue,
        type,
        description,
      });

      return this.systemSettingsRepository.save(newSetting);
    }
  }

  /**
   * Retrieves session timeout related settings
   * @returns Session timeout configuration
   */
  async getSessionTimeoutSettings(): Promise<SessionSettings> {
    return {
      globalTimeoutMinutes: await this.getValue<number>(
        'global_session_timeout_minutes',
        30,
      ),
      warningTimeSeconds: await this.getValue<number>(
        'session_warning_time_seconds',
        60,
      ),
      showWarning: await this.getValue<boolean>(
        'show_session_timeout_warning',
        true,
      ),
      redirectUrl: await this.getValue<string>(
        'session_timeout_redirect_url',
        '/login',
      ),
      warningMessage: await this.getValue<string>(
        'session_timeout_warning_message',
        'Your session is about to expire. Would you like to continue?',
      ),
      maxSessionsPerUser: await this.getValue<number>(
        'session.max_sessions_per_user',
        5,
      ),
      enforceSingleSession: await this.getValue<boolean>(
        'session.enforce_single_session',
        false,
      ),
    };
  }

  /**
   * Retrieves authentication related settings
   * @returns Authentication configuration
   */
  async getAuthenticationSettings(): Promise<AuthSettings> {
    return {
      enableEmailAuth: await this.getValue<boolean>('enable_email_auth', true),
      enableSmsAuth: await this.getValue<boolean>('enable_sms_auth', true),
      enableGoogleAuth: await this.getValue<boolean>(
        'enable_google_auth',
        false,
      ),
      enableAppleAuth: await this.getValue<boolean>('enable_apple_auth', false),
      enableMfa: await this.getValue<boolean>('enable_mfa', true),
      enableWebauthn: await this.getValue<boolean>('enable_webauthn', true),
      passwordMinLength: await this.getValue<number>('password_min_length', 8),
      passwordRequireUppercase: await this.getValue<boolean>(
        'password_require_uppercase',
        true,
      ),
      passwordRequireLowercase: await this.getValue<boolean>(
        'password_require_lowercase',
        true,
      ),
      passwordRequireNumber: await this.getValue<boolean>(
        'password_require_number',
        true,
      ),
      passwordRequireSpecial: await this.getValue<boolean>(
        'password_require_special',
        true,
      ),
      maxLoginAttempts: await this.getValue<number>('max_login_attempts', 5),
      loginLockoutDuration: await this.getValue<number>(
        'login_lockout_duration',
        30,
      ),
    };
  }

  /**
   * Get profile update settings
   * @returns Profile update settings
   */
  /**
   * Retrieves profile update related settings
   * @returns Profile update configuration
   */
  async getProfileSettings(): Promise<ProfileSettings> {
    return {
      allowUserProfileUpdate: await this.getValue<boolean>(
        'ALLOW_USER_PROFILE_UPDATE',
        true,
      ),
      profileUpdatableFields: await this.getValue<string[]>(
        'PROFILE_UPDATABLE_FIELDS',
        [
          'firstName',
          'lastName',
          'avatar',
          'company',
          'department',
          'country',
          'state',
          'address',
          'address2',
          'city',
          'zipCode',
          'bio',
        ],
      ),
    };
  }

  /**
   * Retrieves token related settings
   * @returns Token configuration
   */
  async getTokenSettings(): Promise<TokenSettings> {
    return {
      refreshTokenDuration: await this.getValue<number>(
        'refresh_token_duration',
        7,
      ),
      accessTokenDuration: await this.getValue<number>(
        'access_token_duration',
        15,
      ),
    };
  }

  /**
   * Updates or creates multiple settings at once
   * @param settings - Array of settings to update
   * @returns Array of updated or created settings
   */
  async upsertBulkSettings<T>(
    settings: SettingValue<T>[],
  ): Promise<SystemSetting[]> {
    const results: SystemSetting[] = [];

    for (const setting of settings) {
      const result = await this.setValue(
        setting.key,
        setting.value,
        setting.type || 'string',
        setting.description,
      );

      results.push(result);
    }

    return results;
  }

  /**
   * Deletes a setting by key
   * @param key - Setting key to delete
   * @returns True if setting was deleted, false otherwise
   */
  async delete(key: string): Promise<boolean> {
    const result = await this.systemSettingsRepository.delete({ key });
    return result.affected ? result.affected > 0 : false;
  }
}
