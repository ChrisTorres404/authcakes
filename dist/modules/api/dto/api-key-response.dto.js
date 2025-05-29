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
exports.ApiKeyListResponseDto = exports.ApiKeyResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ApiKeyResponseDto {
    id;
    userId;
    tenantId;
    name;
    key;
    permissions;
    expiresAt;
    active;
    createdAt;
    updatedAt;
}
exports.ApiKeyResponseDto = ApiKeyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'API key unique identifier' }),
    __metadata("design:type", String)
], ApiKeyResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID who owns this API key' }),
    __metadata("design:type", String)
], ApiKeyResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Tenant ID associated with this API key',
    }),
    __metadata("design:type", String)
], ApiKeyResponseDto.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Name of the API key' }),
    __metadata("design:type", String)
], ApiKeyResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The API key value (only shown on creation)' }),
    __metadata("design:type", String)
], ApiKeyResponseDto.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'API key permissions object' }),
    __metadata("design:type", Object)
], ApiKeyResponseDto.prototype, "permissions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'API key expiration date' }),
    __metadata("design:type", Date)
], ApiKeyResponseDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the API key is active' }),
    __metadata("design:type", Boolean)
], ApiKeyResponseDto.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], ApiKeyResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last update timestamp' }),
    __metadata("design:type", Date)
], ApiKeyResponseDto.prototype, "updatedAt", void 0);
class ApiKeyListResponseDto {
    apiKeys;
}
exports.ApiKeyListResponseDto = ApiKeyListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ApiKeyResponseDto] }),
    __metadata("design:type", Array)
], ApiKeyListResponseDto.prototype, "apiKeys", void 0);
//# sourceMappingURL=api-key-response.dto.js.map