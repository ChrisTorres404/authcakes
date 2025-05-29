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
exports.UpdateTenantMemberRoleDto = exports.InviteTenantMemberDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const tenant_invitation_dto_1 = require("./tenant-invitation.dto");
class InviteTenantMemberDto {
    email;
    role;
    invitedBy;
}
exports.InviteTenantMemberDto = InviteTenantMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com' }),
    __metadata("design:type", String)
], InviteTenantMemberDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: tenant_invitation_dto_1.TenantRole, example: tenant_invitation_dto_1.TenantRole.MEMBER }),
    __metadata("design:type", String)
], InviteTenantMemberDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-inviting-user' }),
    __metadata("design:type", String)
], InviteTenantMemberDto.prototype, "invitedBy", void 0);
class UpdateTenantMemberRoleDto {
    role;
}
exports.UpdateTenantMemberRoleDto = UpdateTenantMemberRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: tenant_invitation_dto_1.TenantRole, example: tenant_invitation_dto_1.TenantRole.ADMIN }),
    __metadata("design:type", String)
], UpdateTenantMemberRoleDto.prototype, "role", void 0);
//# sourceMappingURL=tenant-member.dto.js.map