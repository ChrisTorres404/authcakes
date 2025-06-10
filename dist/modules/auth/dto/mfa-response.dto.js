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
exports.MfaVerifyResponseDto = exports.MfaEnrollResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class MfaEnrollResponseDto {
    secret;
    otpauth_url;
    setupStatus;
}
exports.MfaEnrollResponseDto = MfaEnrollResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'BASE32SECRET' }),
    __metadata("design:type", String)
], MfaEnrollResponseDto.prototype, "secret", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'otpauth://totp/Service:user@example.com?secret=BASE32SECRET&issuer=Service',
        required: false
    }),
    __metadata("design:type", String)
], MfaEnrollResponseDto.prototype, "otpauth_url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'pending' }),
    __metadata("design:type", String)
], MfaEnrollResponseDto.prototype, "setupStatus", void 0);
class MfaVerifyResponseDto {
    message;
    recoveryCodes;
}
exports.MfaVerifyResponseDto = MfaVerifyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'MFA enabled successfully',
        required: false
    }),
    __metadata("design:type", String)
], MfaVerifyResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [String],
        example: ['ABC123', 'DEF456', 'GHI789'],
        required: false,
        description: 'Recovery codes (only returned when first enabling MFA)'
    }),
    __metadata("design:type", Array)
], MfaVerifyResponseDto.prototype, "recoveryCodes", void 0);
//# sourceMappingURL=mfa-response.dto.js.map