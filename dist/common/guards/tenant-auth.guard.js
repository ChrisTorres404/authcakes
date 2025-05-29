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
var TenantAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const tenants_service_1 = require("../../modules/tenants/services/tenants.service");
const tenant_roles_decorator_1 = require("../decorators/tenant-roles.decorator");
let TenantAuthGuard = TenantAuthGuard_1 = class TenantAuthGuard {
    reflector;
    tenantsService;
    logger = new common_1.Logger(TenantAuthGuard_1.name);
    constructor(reflector, tenantsService) {
        this.reflector = reflector;
        this.tenantsService = tenantsService;
    }
    async canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(tenant_roles_decorator_1.REQUIRED_TENANT_ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]) || [];
        if (!requiredRoles.length) {
            this.logger.debug('[TenantAuthGuard] No requiredRoles, access allowed');
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const headerTenantId = request.headers['x-tenant-id'];
        const tenantIdFromHeader = Array.isArray(headerTenantId)
            ? headerTenantId[0]
            : headerTenantId;
        let tenantId = request.params.tenantId ||
            request.body.tenantId ||
            tenantIdFromHeader ||
            request.tenantId;
        if (!tenantId && user && user.tenantId) {
            tenantId = user.tenantId;
            this.logger.debug('[TenantAuthGuard] Fallback: using tenantId from user.tenantId in JWT:', tenantId);
        }
        this.logger.debug(`[TenantAuthGuard] Checking access for user:`, user);
        this.logger.debug(`[TenantAuthGuard] tenantId:`, tenantId);
        this.logger.debug(`[TenantAuthGuard] user.tenantAccess:`, user?.tenantAccess);
        this.logger.debug(`[TenantAuthGuard] requiredRoles:`, requiredRoles);
        if (!tenantId) {
            this.logger.warn(`[TenantAuthGuard] Access denied: Missing tenant context for user ${user?.id}`);
            this.logAuditEvent();
            throw new common_1.ForbiddenException('Tenant context is required');
        }
        if (!user || !Array.isArray(user.tenantAccess)) {
            this.logger.warn(`[TenantAuthGuard] Access denied: Missing user or tenantAccess. user:`, user, 'tenantAccess:', user?.tenantAccess);
            this.logAuditEvent();
            throw new common_1.ForbiddenException('User context is required');
        }
        if (!user.tenantAccess.includes(tenantId)) {
            this.logger.warn(`[TenantAuthGuard] Access denied: User ${user?.id} does not have access to tenant ${tenantId}`);
            this.logAuditEvent();
            throw new common_1.ForbiddenException('User does not have access to this tenant');
        }
        if (requiredRoles.length === 0) {
            this.logger.log(`[TenantAuthGuard] Access granted: User ${user?.id} has access to tenant ${tenantId} (no specific role required)`);
            this.logAuditEvent();
            return true;
        }
        const membership = await this.tenantsService.getUserTenantMembership(user.id, tenantId);
        this.logger.debug(`[TenantAuthGuard] membership:`, membership);
        if (!membership) {
            this.logger.warn(`[TenantAuthGuard] Access denied: User ${user?.id} is not a member of tenant ${tenantId}`);
            this.logAuditEvent();
            throw new common_1.ForbiddenException('User is not a member of this tenant');
        }
        if (!requiredRoles.includes(membership.role)) {
            this.logger.warn(`[TenantAuthGuard] Access denied: User ${user?.id} has role ${membership.role} but requires one of [${requiredRoles.join(', ')}] in tenant ${tenantId}`);
            this.logAuditEvent();
            throw new common_1.ForbiddenException('User does not have the required role for this tenant');
        }
        this.logger.log(`[TenantAuthGuard] Access granted: User ${user?.id} with role ${membership.role} in tenant ${tenantId}`);
        this.logAuditEvent();
        return true;
    }
    logAuditEvent() {
    }
};
exports.TenantAuthGuard = TenantAuthGuard;
exports.TenantAuthGuard = TenantAuthGuard = TenantAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        tenants_service_1.TenantsService])
], TenantAuthGuard);
//# sourceMappingURL=tenant-auth.guard.js.map