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
exports.SystemTokenResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SystemTokenResponseDto {
    success;
    token;
    expiresIn;
    tokenType;
    clientId;
}
exports.SystemTokenResponseDto = SystemTokenResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], SystemTokenResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoic3lzdGVtIiwiY2xpZW50SWQiOiJtb2JpbGUtYXBwLXYxIiwiYXBpS2V5SGFzaCI6ImFiY2RlZjEyMzQ1Njc4OTAiLCJwZXJtaXNzaW9ucyI6WyJyZWFkIiwid3JpdGUiXSwiaWF0IjoxNjA5NDU5MjAwLCJleHAiOjE2MDk1NDU2MDAsImF1ZCI6IkF1dGhDYWtlcy1TeXN0ZW0iLCJpc3MiOiJBdXRoQ2FrZXMtQVBJIn0.signature',
        description: 'System JWT token',
    }),
    __metadata("design:type", String)
], SystemTokenResponseDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 86400,
        description: 'Token expiration time in seconds',
    }),
    __metadata("design:type", Number)
], SystemTokenResponseDto.prototype, "expiresIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Bearer',
        description: 'Token type',
    }),
    __metadata("design:type", String)
], SystemTokenResponseDto.prototype, "tokenType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'mobile-app-v1',
        description: 'Client identifier',
    }),
    __metadata("design:type", String)
], SystemTokenResponseDto.prototype, "clientId", void 0);
//# sourceMappingURL=system-token-response.dto.js.map