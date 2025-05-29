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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileUpdateGuard = void 0;
const common_1 = require("@nestjs/common");
const settings_service_1 = require("../../settings/services/settings.service");
const core_1 = require("@nestjs/core");
let ProfileUpdateGuard = class ProfileUpdateGuard {
    settingsService;
    reflector;
    constructor(settingsService, reflector) {
        this.settingsService = settingsService;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const updatedFields = Object.keys(request.body);
        const isAdminRoute = this.reflector.get('isAdminRoute', context.getHandler());
        if (isAdminRoute && request.user && request.user.role === 'admin') {
            return true;
        }
        const allowProfileUpdate = await this.settingsService.getValue('ALLOW_USER_PROFILE_UPDATE', true);
        if (!allowProfileUpdate) {
            throw new common_1.ForbiddenException('Profile updates are not allowed');
        }
        const allowedFields = await this.settingsService.getValue('PROFILE_UPDATABLE_FIELDS', [
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
        ]);
        const unauthorizedFields = updatedFields.filter((field) => !allowedFields.includes(field));
        if (unauthorizedFields.length > 0) {
            throw new common_1.ForbiddenException(`You are not allowed to update the following fields: ${unauthorizedFields.join(', ')}`);
        }
        return true;
    }
};
exports.ProfileUpdateGuard = ProfileUpdateGuard;
exports.ProfileUpdateGuard = ProfileUpdateGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [settings_service_1.SettingsService,
        core_1.Reflector])
], ProfileUpdateGuard);
//# sourceMappingURL=profile-update.guard.js.map