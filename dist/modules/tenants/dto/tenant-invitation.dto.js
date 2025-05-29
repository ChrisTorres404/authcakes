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
exports.TenantInvitationDto = exports.TenantRole = void 0;
const swagger_1 = require("@nestjs/swagger");
var TenantRole;
(function (TenantRole) {
    TenantRole["ADMIN"] = "admin";
    TenantRole["MEMBER"] = "member";
    TenantRole["VIEWER"] = "viewer";
})(TenantRole || (exports.TenantRole = TenantRole = {}));
class TenantInvitationDto {
    id;
    tenantId;
    invitedBy;
    email;
    role;
    token;
    expiresAt;
    acceptedAt;
    acceptedBy;
    createdAt;
    updatedAt;
}
exports.TenantInvitationDto = TenantInvitationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-invitation' }),
    __metadata("design:type", String)
], TenantInvitationDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-tenant' }),
    __metadata("design:type", String)
], TenantInvitationDto.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-user' }),
    __metadata("design:type", String)
], TenantInvitationDto.prototype, "invitedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com' }),
    __metadata("design:type", String)
], TenantInvitationDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: TenantRole.MEMBER, enum: TenantRole }),
    __metadata("design:type", String)
], TenantInvitationDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'token-string' }),
    __metadata("design:type", String)
], TenantInvitationDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'string', format: 'date-time' }),
    __metadata("design:type", String)
], TenantInvitationDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: 'string', format: 'date-time', nullable: true }),
    __metadata("design:type", String)
], TenantInvitationDto.prototype, "acceptedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-of-user', nullable: true }),
    __metadata("design:type", String)
], TenantInvitationDto.prototype, "acceptedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'string', format: 'date-time' }),
    __metadata("design:type", String)
], TenantInvitationDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'string', format: 'date-time' }),
    __metadata("design:type", String)
], TenantInvitationDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=tenant-invitation.dto.js.map