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
const update_user_profile_dto_1 = require("../dto/update-user-profile.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const profile_update_guard_1 = require("../guards/profile-update.guard");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const is_admin_route_decorator_1 = require("../../../common/decorators/is-admin-route.decorator");
const tenant_auth_guard_1 = require("../../../common/guards/tenant-auth.guard");
const swagger_1 = require("@nestjs/swagger");
const user_entity_1 = require("../entities/user.entity");
const user_profile_dto_1 = require("../dto/user-profile.dto");
const user_response_dto_1 = require("../dto/user-response.dto");
const common_2 = require("@nestjs/common");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async create(createUserDto) {
        return this.usersService.create(createUserDto);
    }
    findAll(search) {
        return this.usersService.search(search || '');
    }
    async getProfile(user) {
        common_2.Logger.log(`Profile access - UserID: ${user.sub}, SessionID: ${user.sessionId}`, 'UsersController');
        const entity = await this.usersService.findById(user.sub);
        if (entity.id !== user.sub) {
            common_2.Logger.error(`Profile access security violation - JWT UserID: ${user.sub}, DB UserID: ${entity.id}`, 'UsersController');
            throw new common_1.NotFoundException('User profile not found');
        }
        return {
            id: entity.id,
            email: entity.email,
            firstName: entity.firstName,
            lastName: entity.lastName,
            role: entity.role,
            active: entity.active,
            emailVerified: entity.emailVerified,
            phoneVerified: entity.phoneVerified,
            avatar: entity.avatar,
        };
    }
    async updateProfile(user, updateUserProfileDto, request) {
        const requestInfo = {
            ip: request.ip,
            userAgent: request.headers['user-agent'],
        };
        return this.usersService.updateProfile(user.sub, updateUserProfileDto, user.sub, requestInfo);
    }
    async findOne(id) {
        const entity = await this.usersService.findById(id);
        return {
            id: entity.id,
            email: entity.email,
            firstName: entity.firstName,
            lastName: entity.lastName,
            role: entity.role,
            active: entity.active,
            emailVerified: entity.emailVerified,
            avatar: entity.avatar,
            phoneNumber: entity.phoneNumber,
            phoneVerified: entity.phoneVerified,
            lastLogin: entity.lastLogin,
            company: entity.company,
            department: entity.department,
            country: entity.country,
            state: entity.state,
            address: entity.address,
            address2: entity.address2,
            city: entity.city,
            zipCode: entity.zipCode,
            bio: entity.bio,
            mfaEnabled: entity.mfaEnabled,
            mfaType: entity.mfaType,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
    async update(id, updateUserDto, admin, request) {
        if (updateUserDto instanceof update_user_profile_dto_1.UpdateUserProfileDto) {
            const requestInfo = {
                ip: request.ip,
                userAgent: request.headers['user-agent'],
            };
            return this.usersService.updateProfile(id, updateUserDto, admin.sub, requestInfo);
        }
        return this.usersService.update(id, updateUserDto);
    }
    async remove(id) {
        return this.usersService.remove(id);
    }
    async verifyEmail(token) {
        return this.usersService.verifyEmail(token);
    }
    async verifyPhone(token) {
        return this.usersService.verifyPhone(token);
    }
    async listDevices(user) {
        common_2.Logger.log(`DeviceManagement: listDevices - User ${user.sub}`, 'UsersController');
        let devices = await this.usersService.listActiveSessions(user.sub);
        if (!Array.isArray(devices)) {
            devices = [];
        }
        return { devices: devices };
    }
    async revokeDevice(user, sessionId) {
        common_2.Logger.log(`DeviceManagement: revokeDevice - User ${user.sub}, Session ${sessionId}`, 'UsersController');
        await this.usersService.revokeSession(user.sub, sessionId);
        return { success: true };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, is_admin_route_decorator_1.IsAdminRoute)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new user' }),
    (0, swagger_1.ApiBody)({ type: create_user_dto_1.CreateUserDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User created', type: user_entity_1.User }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, is_admin_route_decorator_1.IsAdminRoute)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all users' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of users', type: [user_entity_1.User] }),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Current user profile',
        type: user_profile_dto_1.UserProfileDto,
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, common_1.UseGuards)(profile_update_guard_1.ProfileUpdateGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Update current user profile' }),
    (0, swagger_1.ApiBody)({ type: update_user_profile_dto_1.UpdateUserProfileDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile updated', type: user_entity_1.User }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Profile updates not allowed or field update not permitted',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_user_profile_dto_1.UpdateUserProfileDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, is_admin_route_decorator_1.IsAdminRoute)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User found',
        type: user_response_dto_1.UserResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, is_admin_route_decorator_1.IsAdminRoute)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update user by ID (admin only)' }),
    (0, swagger_1.ApiBody)({ type: update_user_dto_1.UpdateUserDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User updated', type: user_entity_1.User }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, is_admin_route_decorator_1.IsAdminRoute)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Verify user email' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['token'],
            properties: { token: { type: 'string' } },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email verified' }),
    __param(0, (0, common_1.Body)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('verify-phone'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Verify user phone' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['token'],
            properties: { token: { type: 'string' } },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Phone verified' }),
    __param(0, (0, common_1.Body)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "verifyPhone", null);
__decorate([
    (0, common_1.Get)('devices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_auth_guard_1.TenantAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'List active user devices/sessions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of devices' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "listDevices", null);
__decorate([
    (0, common_1.Post)('devices/:id/revoke'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_auth_guard_1.TenantAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke a device/session by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Device revoked' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "revokeDevice", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('v1/users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map