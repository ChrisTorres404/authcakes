"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const system_setting_entity_1 = require("../entities/system-setting.entity");
let SettingsService = SettingsService_1 = class SettingsService {
    systemSettingsRepository;
    logger = new common_1.Logger(SettingsService_1.name);
    constructor(systemSettingsRepository) {
        this.systemSettingsRepository = systemSettingsRepository;
    }
    async findAll() {
        return this.systemSettingsRepository.find();
    }
    async findByKey(key) {
        return this.systemSettingsRepository.findOne({ where: { key } });
    }
    async getValue(key, defaultValue) {
        const setting = await this.findByKey(key);
        if (!setting) {
            this.logger.debug(`Setting "${key}" not found, using default value: ${String(defaultValue)}`);
            return defaultValue;
        }
        try {
            switch (setting.type) {
                case 'number':
                    return Number(setting.value);
                case 'boolean':
                    return (setting.value.toLowerCase() === 'true');
                case 'json':
                    return JSON.parse(setting.value);
                default:
                    return setting.value;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Error parsing setting "${key}" with type "${setting.type}": ${errorMessage}`);
            return defaultValue;
        }
    }
    async setValue(key, value, type = 'string', description) {
        let stringValue;
        try {
            if (type === 'json') {
                stringValue = JSON.stringify(value);
            }
            else {
                stringValue = String(value);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Error serializing value for setting "${key}": ${errorMessage}`);
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
        }
        else {
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
            globalTimeoutMinutes: await this.getValue('global_session_timeout_minutes', 30),
            warningTimeSeconds: await this.getValue('session_warning_time_seconds', 60),
            showWarning: await this.getValue('show_session_timeout_warning', true),
            redirectUrl: await this.getValue('session_timeout_redirect_url', '/login'),
            warningMessage: await this.getValue('session_timeout_warning_message', 'Your session is about to expire. Would you like to continue?'),
            maxSessionsPerUser: await this.getValue('session.max_sessions_per_user', 5),
            enforceSingleSession: await this.getValue('session.enforce_single_session', false),
        };
    }
    async getAuthenticationSettings() {
        return {
            enableEmailAuth: await this.getValue('enable_email_auth', true),
            enableSmsAuth: await this.getValue('enable_sms_auth', true),
            enableGoogleAuth: await this.getValue('enable_google_auth', false),
            enableAppleAuth: await this.getValue('enable_apple_auth', false),
            enableMfa: await this.getValue('enable_mfa', true),
            enableWebauthn: await this.getValue('enable_webauthn', true),
            passwordMinLength: await this.getValue('password_min_length', 8),
            passwordRequireUppercase: await this.getValue('password_require_uppercase', true),
            passwordRequireLowercase: await this.getValue('password_require_lowercase', true),
            passwordRequireNumber: await this.getValue('password_require_number', true),
            passwordRequireSpecial: await this.getValue('password_require_special', true),
            maxLoginAttempts: await this.getValue('max_login_attempts', 5),
            loginLockoutDuration: await this.getValue('login_lockout_duration', 30),
        };
    }
    async getProfileSettings() {
        return {
            allowUserProfileUpdate: await this.getValue('ALLOW_USER_PROFILE_UPDATE', true),
            profileUpdatableFields: await this.getValue('PROFILE_UPDATABLE_FIELDS', [
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
            ]),
        };
    }
    async getTokenSettings() {
        return {
            refreshTokenDuration: await this.getValue('refresh_token_duration', 7),
            accessTokenDuration: await this.getValue('access_token_duration', 15),
        };
    }
    async upsertBulkSettings(settings) {
        const results = [];
        for (const setting of settings) {
            const result = await this.setValue(setting.key, setting.value, setting.type || 'string', setting.description);
            results.push(result);
        }
        return results;
    }
    async delete(key) {
        const result = await this.systemSettingsRepository.delete({ key });
        return result.affected ? result.affected > 0 : false;
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = SettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(system_setting_entity_1.SystemSetting)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SettingsService);
//# sourceMappingURL=settings.service.js.map