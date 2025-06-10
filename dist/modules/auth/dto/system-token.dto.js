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
exports.SystemTokenDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class SystemTokenDto {
    apiKey;
    clientId;
    permissions;
}
exports.SystemTokenDto = SystemTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'sk_live_gmt9MsfGM5h830F8JFVQ5NCmgQnBj6ECGhzbDCBZG8aW5dOCYu7vC591IVZ8j',
        description: 'System API key',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SystemTokenDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'mobile-app-v1',
        description: 'Client identifier',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SystemTokenDto.prototype, "clientId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: ['read', 'write'],
        description: 'Requested permissions',
        isArray: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SystemTokenDto.prototype, "permissions", void 0);
//# sourceMappingURL=system-token.dto.js.map