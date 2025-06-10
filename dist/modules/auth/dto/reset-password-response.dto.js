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
exports.ResetPasswordResponseDto = exports.ResetPasswordUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ResetPasswordUserDto {
    id;
    email;
    firstName;
    lastName;
    role;
    emailVerified;
}
exports.ResetPasswordUserDto = ResetPasswordUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    __metadata("design:type", String)
], ResetPasswordUserDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com' }),
    __metadata("design:type", String)
], ResetPasswordUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John' }),
    __metadata("design:type", String)
], ResetPasswordUserDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Doe' }),
    __metadata("design:type", String)
], ResetPasswordUserDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user', enum: ['user', 'admin'] }),
    __metadata("design:type", String)
], ResetPasswordUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], ResetPasswordUserDto.prototype, "emailVerified", void 0);
class ResetPasswordResponseDto {
    user;
}
exports.ResetPasswordResponseDto = ResetPasswordResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: ResetPasswordUserDto }),
    __metadata("design:type", ResetPasswordUserDto)
], ResetPasswordResponseDto.prototype, "user", void 0);
//# sourceMappingURL=reset-password-response.dto.js.map