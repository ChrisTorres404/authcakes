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
exports.LogsController = void 0;
const common_1 = require("@nestjs/common");
const logs_service_1 = require("../services/logs.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const tenant_auth_guard_1 = require("../../../common/guards/tenant-auth.guard");
const tenant_roles_decorator_1 = require("../../../common/decorators/tenant-roles.decorator");
let LogsController = class LogsController {
    logsService;
    constructor(logsService) {
        this.logsService = logsService;
    }
    async findMyLogs(req, page = 1, limit = 20) {
        return this.logsService.findUserLogs(req.user.id, page, limit);
    }
    async findTenantLogs(tenantId, page = 1, limit = 20) {
        return this.logsService.findTenantLogs(tenantId, page, limit);
    }
    async findAdminLogs(userId, tenantId, action, page = 1, limit = 20) {
        const filters = {};
        if (userId)
            filters.userId = userId;
        if (tenantId)
            filters.tenantId = tenantId;
        if (action)
            filters.action = action;
        return this.logsService.findAll(filters, page, limit);
    }
    async createAdminLog(req, logData) {
        return this.logsService.logAdminAction(logData.action, req.user.id, logData.details, req);
    }
};
exports.LogsController = LogsController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], LogsController.prototype, "findMyLogs", null);
__decorate([
    (0, common_1.Get)('tenant/:tenantId'),
    (0, common_1.UseGuards)(tenant_auth_guard_1.TenantAuthGuard),
    (0, tenant_roles_decorator_1.TenantRoles)('admin'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LogsController.prototype, "findTenantLogs", null);
__decorate([
    (0, common_1.Get)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('tenantId')),
    __param(2, (0, common_1.Query)('action')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], LogsController.prototype, "findAdminLogs", null);
__decorate([
    (0, common_1.Post)('admin/log'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LogsController.prototype, "createAdminLog", null);
exports.LogsController = LogsController = __decorate([
    (0, common_1.Controller)('logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [logs_service_1.LogsService])
], LogsController);
//# sourceMappingURL=logs.controller.js.map