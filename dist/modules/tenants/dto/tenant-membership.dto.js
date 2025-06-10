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
exports.TenantMembershipDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const tenant_invitation_dto_1 = require("./tenant-invitation.dto");
class TenantMembershipDto {
    id;
    userId;
    tenantId;
    role;
    createdAt;
    updatedAt;
    deletedAt;
}
exports.TenantMembershipDto = TenantMembershipDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-membership' }),
    __metadata("design:type", String)
], TenantMembershipDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-user' }),
    __metadata("design:type", String)
], TenantMembershipDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-tenant' }),
    __metadata("design:type", String)
], TenantMembershipDto.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: tenant_invitation_dto_1.TenantRole.MEMBER, enum: tenant_invitation_dto_1.TenantRole }),
    __metadata("design:type", String)
], TenantMembershipDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01T00:00:00Z', type: 'string', format: 'date-time' }),
    __metadata("design:type", String)
], TenantMembershipDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T10:30:00Z', type: 'string', format: 'date-time' }),
    __metadata("design:type", String)
], TenantMembershipDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: null, type: 'string', format: 'date-time', nullable: true }),
    __metadata("design:type", String)
], TenantMembershipDto.prototype, "deletedAt", void 0);
//# sourceMappingURL=tenant-membership.dto.js.map