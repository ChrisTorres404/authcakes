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
exports.AuthSettingsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AuthSettingsDto {
    enableEmailAuth;
    enableSmsAuth;
    enableGoogleAuth;
    enableAppleAuth;
    enableMfa;
    enableWebauthn;
    passwordMinLength;
    passwordRequireUppercase;
    passwordRequireLowercase;
    passwordRequireNumber;
    passwordRequireSpecial;
    maxLoginAttempts;
    loginLockoutDuration;
}
exports.AuthSettingsDto = AuthSettingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Enable email authentication.' }),
    __metadata("design:type", Boolean)
], AuthSettingsDto.prototype, "enableEmailAuth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Enable SMS authentication.' }),
    __metadata("design:type", Boolean)
], AuthSettingsDto.prototype, "enableSmsAuth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Enable Google authentication.' }),
    __metadata("design:type", Boolean)
], AuthSettingsDto.prototype, "enableGoogleAuth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Enable Apple authentication.' }),
    __metadata("design:type", Boolean)
], AuthSettingsDto.prototype, "enableAppleAuth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Enable multi-factor authentication (MFA).' }),
    __metadata("design:type", Boolean)
], AuthSettingsDto.prototype, "enableMfa", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Enable WebAuthn authentication.' }),
    __metadata("design:type", Boolean)
], AuthSettingsDto.prototype, "enableWebauthn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 8, description: 'Minimum password length.' }),
    __metadata("design:type", Number)
], AuthSettingsDto.prototype, "passwordMinLength", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Require uppercase letter in password.' }),
    __metadata("design:type", Boolean)
], AuthSettingsDto.prototype, "passwordRequireUppercase", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Require lowercase letter in password.' }),
    __metadata("design:type", Boolean)
], AuthSettingsDto.prototype, "passwordRequireLowercase", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Require number in password.' }),
    __metadata("design:type", Boolean)
], AuthSettingsDto.prototype, "passwordRequireNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Require special character in password.' }),
    __metadata("design:type", Boolean)
], AuthSettingsDto.prototype, "passwordRequireSpecial", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5, description: 'Maximum login attempts before lockout.' }),
    __metadata("design:type", Number)
], AuthSettingsDto.prototype, "maxLoginAttempts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 30, description: 'Login lockout duration in minutes.' }),
    __metadata("design:type", Number)
], AuthSettingsDto.prototype, "loginLockoutDuration", void 0);
//# sourceMappingURL=auth-settings.dto.js.map