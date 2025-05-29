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
exports.SessionSettingsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SessionSettingsDto {
    globalTimeoutMinutes;
    warningTimeSeconds;
    showWarning;
    redirectUrl;
    warningMessage;
    maxSessionsPerUser;
    enforceSingleSession;
}
exports.SessionSettingsDto = SessionSettingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 30,
        description: 'Global session timeout in minutes.',
    }),
    __metadata("design:type", Number)
], SessionSettingsDto.prototype, "globalTimeoutMinutes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 60,
        description: 'Time in seconds before session timeout to show warning.',
    }),
    __metadata("design:type", Number)
], SessionSettingsDto.prototype, "warningTimeSeconds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: true,
        description: 'Whether to show session timeout warning.',
    }),
    __metadata("design:type", Boolean)
], SessionSettingsDto.prototype, "showWarning", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '/login',
        description: 'URL to redirect to after session timeout.',
    }),
    __metadata("design:type", String)
], SessionSettingsDto.prototype, "redirectUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Your session is about to expire. Would you like to continue?',
        description: 'Warning message to display before session timeout.',
    }),
    __metadata("design:type", String)
], SessionSettingsDto.prototype, "warningMessage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 5,
        description: 'Maximum number of sessions per user.',
    }),
    __metadata("design:type", Number)
], SessionSettingsDto.prototype, "maxSessionsPerUser", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: false,
        description: 'Whether to enforce single session per user.',
    }),
    __metadata("design:type", Boolean)
], SessionSettingsDto.prototype, "enforceSingleSession", void 0);
//# sourceMappingURL=session-settings.dto.js.map