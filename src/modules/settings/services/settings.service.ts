// src/modules/settings/services/settings.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../entities/system-setting.entity';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(SystemSetting)
    private readonly systemSettingsRepository: Repository<SystemSetting>,
  ) {}

  async findAll(): Promise<SystemSetting[]> {
    return this.systemSettingsRepository.find();
  }

  async findByKey(key: string): Promise<SystemSetting | null> {
    return this.systemSettingsRepository.findOne({ where: { key } });
  }

  async getValue<T>(key: string, defaultValue?: T): Promise<T> {
    const setting = await this.findByKey(key);
    
    if (!setting) {
      this.logger.debug(`Setting "${key}" not found, using default value: ${defaultValue}`);
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
      this.logger.error(`Error parsing setting "${key}" with type "${setting.type}": ${error.message}`);
      return defaultValue as T;
    }
  }

  async setValue(key: string, value: any, type: string = 'string', description?: string): Promise<SystemSetting> {
    // Convert value to string based on type
    let stringValue: string;
    
    try {
      if (type === 'json') {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }
    } catch (error) {
      this.logger.error(`Error serializing value for setting "${key}": ${error.message}`);
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

  async getSessionTimeoutSettings() {
    return {
      globalTimeoutMinutes: await this.getValue<number>('global_session_timeout_minutes', 30),
      warningTimeSeconds: await this.getValue<number>('session_warning_time_seconds', 60),
      showWarning: await this.getValue<boolean>('show_session_timeout_warning', true),
      redirectUrl: await this.getValue<string>('session_timeout_redirect_url', '/login'),
      warningMessage: await this.getValue<string>(
        'session_timeout_warning_message',
        'Your session is about to expire. Would you like to continue?'
      ),
      maxSessionsPerUser: await this.getValue<number>('session.max_sessions_per_user', 5),
      enforceSingleSession: await this.getValue<boolean>('session.enforce_single_session', false),
    };
  }

  async getAuthenticationSettings() {
    return {
      enableEmailAuth: await this.getValue<boolean>('enable_email_auth', true),
      enableSmsAuth: await this.getValue<boolean>('enable_sms_auth', true),
      enableGoogleAuth: await this.getValue<boolean>('enable_google_auth', false),
      enableAppleAuth: await this.getValue<boolean>('enable_apple_auth', false),
      enableMfa: await this.getValue<boolean>('enable_mfa', true),
      enableWebauthn: await this.getValue<boolean>('enable_webauthn', true),
      passwordMinLength: await this.getValue<number>('password_min_length', 8),
      passwordRequireUppercase: await this.getValue<boolean>('password_require_uppercase', true),
      passwordRequireLowercase: await this.getValue<boolean>('password_require_lowercase', true),
      passwordRequireNumber: await this.getValue<boolean>('password_require_number', true),
      passwordRequireSpecial: await this.getValue<boolean>('password_require_special', true),
      maxLoginAttempts: await this.getValue<number>('max_login_attempts', 5),
      loginLockoutDuration: await this.getValue<number>('login_lockout_duration', 30),
    };
  }

  async getTokenSettings() {
    return {
      refreshTokenDuration: await this.getValue<number>('refresh_token_duration', 7),
      accessTokenDuration: await this.getValue<number>('access_token_duration', 15),
    };
  }

  async upsertBulkSettings(settings: Array<{ key: string; value: any; type?: string; description?: string }>) {
    const results: any[] = [];
    
    for (const setting of settings) {
      const result = await this.setValue(
        setting.key,
        setting.value,
        setting.type || 'string',
        setting.description
      );
      
      results.push(result as any);
    }
    
    return results;
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.systemSettingsRepository.delete({ key });
    return result.affected ? result.affected > 0 : false;
  }
}