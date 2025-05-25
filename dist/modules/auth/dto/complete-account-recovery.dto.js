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
exports.CompleteAccountRecoveryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CompleteAccountRecoveryDto {
    token;
    newPassword;
    mfaCode;
}
exports.CompleteAccountRecoveryDto = CompleteAccountRecoveryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The account recovery token',
        example: 'f8a7c6b5d4e3a2b1c0d9e8f7a6b5c4d3',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Token is required' }),
    (0, class_validator_1.IsString)({ message: 'Token must be a string' }),
    __metadata("design:type", String)
], CompleteAccountRecoveryDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The new password',
        example: 'NewSecurePassword123!',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'New password is required' }),
    (0, class_validator_1.IsString)({ message: 'New password must be a string' }),
    (0, class_validator_1.MinLength)(8, { message: 'New password must be at least 8 characters long' }),
    (0, class_validator_1.Matches)(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'New password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
    }),
    __metadata("design:type", String)
], CompleteAccountRecoveryDto.prototype, "newPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'MFA verification code (required if MFA is enabled)',
        example: '123456',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'MFA code must be a string' }),
    (0, class_validator_1.Length)(6, 6, { message: 'MFA code must be 6 characters long' }),
    __metadata("design:type", String)
], CompleteAccountRecoveryDto.prototype, "mfaCode", void 0);
//# sourceMappingURL=complete-account-recovery.dto.js.map