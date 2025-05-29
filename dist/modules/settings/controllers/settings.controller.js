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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const settings_service_1 = require("../services/settings.service");
const system_setting_entity_1 = require("../entities/system-setting.entity");
const create_setting_dto_1 = require("../dto/create-setting.dto");
const update_setting_dto_1 = require("../dto/update-setting.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const swagger_1 = require("@nestjs/swagger");
const session_settings_dto_1 = require("../dto/session-settings.dto");
const auth_settings_dto_1 = require("../dto/auth-settings.dto");
const token_settings_dto_1 = require("../dto/token-settings.dto");
const profile_settings_dto_1 = require("../dto/profile-settings.dto");
const bulk_setting_dto_1 = require("../dto/bulk-setting.dto");
let SettingsController = class SettingsController {
    settingsService;
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async findAll() {
        return this.settingsService.findAll();
    }
    async findOne(key) {
        const setting = await this.settingsService.findByKey(key);
        if (!setting) {
            throw new common_1.NotFoundException(`Setting with key ${key} not found`);
        }
        return setting;
    }
    async create(createSettingDto) {
        return this.settingsService.setValue(createSettingDto.key, createSettingDto.value, createSettingDto.type, createSettingDto.description);
    }
    async update(key, updateSettingDto) {
        return this.settingsService.setValue(key, updateSettingDto.value, updateSettingDto.type, updateSettingDto.description);
    }
    async remove(key) {
        const result = await this.settingsService.delete(key);
        return { success: result };
    }
    async getSessionSettings() {
        return this.settingsService.getSessionTimeoutSettings();
    }
    async getAuthSettings() {
        return this.settingsService.getAuthenticationSettings();
    }
    async getTokenSettings() {
        return this.settingsService.getTokenSettings();
    }
    async getProfileSettings() {
        return this.settingsService.getProfileSettings();
    }
    async upsertBulkSettings(settings) {
        return this.settingsService.upsertBulkSettings(settings.map(s => ({
            ...s,
            type: s.type,
        })));
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all system settings.' }),
    (0, swagger_1.ApiOkResponse)({
        type: [system_setting_entity_1.SystemSetting],
        description: 'List of all system settings.',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':key'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a system setting by key.' }),
    (0, swagger_1.ApiOkResponse)({ type: system_setting_entity_1.SystemSetting, description: 'The system setting.' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Setting with key not found.' }),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new system setting.' }),
    (0, swagger_1.ApiBody)({ type: create_setting_dto_1.CreateSettingDto }),
    (0, swagger_1.ApiOkResponse)({
        type: system_setting_entity_1.SystemSetting,
        description: 'The created system setting.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Invalid input.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_setting_dto_1.CreateSettingDto]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':key'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a system setting by key.' }),
    (0, swagger_1.ApiBody)({ type: update_setting_dto_1.UpdateSettingDto }),
    (0, swagger_1.ApiOkResponse)({
        type: system_setting_entity_1.SystemSetting,
        description: 'The updated system setting.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Invalid input.' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Setting with key not found.' }),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_setting_dto_1.UpdateSettingDto]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':key'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a system setting by key.' }),
    (0, swagger_1.ApiOkResponse)({
        schema: { example: { success: true } },
        description: 'Setting deleted.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Setting with key not found.' }),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('categories/session'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get session timeout settings.' }),
    (0, swagger_1.ApiOkResponse)({
        type: session_settings_dto_1.SessionSettingsDto,
        description: 'Session timeout settings.',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getSessionSettings", null);
__decorate([
    (0, common_1.Get)('categories/authentication'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get authentication settings.' }),
    (0, swagger_1.ApiOkResponse)({
        type: auth_settings_dto_1.AuthSettingsDto,
        description: 'Authentication settings.',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getAuthSettings", null);
__decorate([
    (0, common_1.Get)('categories/tokens'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get token settings.' }),
    (0, swagger_1.ApiOkResponse)({ type: token_settings_dto_1.TokenSettingsDto, description: 'Token settings.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getTokenSettings", null);
__decorate([
    (0, common_1.Get)('categories/profile'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get profile update settings.' }),
    (0, swagger_1.ApiOkResponse)({
        type: profile_settings_dto_1.ProfileSettingsDto,
        description: 'Profile update settings.',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getProfileSettings", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Upsert multiple system settings in bulk.' }),
    (0, swagger_1.ApiBody)({ type: [bulk_setting_dto_1.BulkSettingDto] }),
    (0, swagger_1.ApiOkResponse)({
        type: [system_setting_entity_1.SystemSetting],
        description: 'The upserted system settings.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Invalid input.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "upsertBulkSettings", null);
exports.SettingsController = SettingsController = __decorate([
    (0, swagger_1.ApiTags)('Settings'),
    (0, common_1.Controller)('settings'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map