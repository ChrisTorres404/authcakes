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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const users_service_1 = require("../services/users.service");
const create_user_dto_1 = require("../dto/create-user.dto");
const update_user_dto_1 = require("../dto/update-user.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const tenant_auth_guard_1 = require("../../../common/guards/tenant-auth.guard");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    create(createUserDto) {
        return this.usersService.create(createUserDto);
    }
    findAll(query) {
        return this.usersService.search(query);
    }
    getProfile(user) {
        return this.usersService.findById(user.id);
    }
    findOne(id) {
        return this.usersService.findById(id);
    }
    update(id, updateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }
    updateProfile(user, updateUserDto) {
        return this.usersService.update(user.id, updateUserDto);
    }
    remove(id) {
        return this.usersService.remove(id);
    }
    async verifyEmail(token) {
        return this.usersService.verifyEmail(token);
    }
    async verifyPhone(token) {
        return this.usersService.verifyPhone(token);
    }
    async listDevices(user) {
        console.log('[Audit] DeviceManagement: listDevices', { userId: user.id, tenantId: user.tenantId, action: 'listDevices' });
        const devices = await this.usersService.listActiveSessions(user.id);
        console.log('[DeviceManagement] Active sessions:', devices);
        return {
            devices
        };
    }
    async revokeDevice(user, sessionId) {
        console.log('[Audit] DeviceManagement: revokeDevice', { userId: user.id, tenantId: user.tenantId, action: 'revokeDevice', sessionId });
        await this.usersService.revokeSession(user.id, sessionId);
        return { success: true };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('verify-phone'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "verifyPhone", null);
__decorate([
    (0, common_1.Get)('devices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_auth_guard_1.TenantAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "listDevices", null);
__decorate([
    (0, common_1.Post)('devices/:id/revoke'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_auth_guard_1.TenantAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "revokeDevice", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map