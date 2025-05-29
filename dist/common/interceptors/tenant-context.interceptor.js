"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TenantContextInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContextInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
function isTenantError(error) {
    return error instanceof Error;
}
let TenantContextInterceptor = TenantContextInterceptor_1 = class TenantContextInterceptor {
    logger = new common_1.Logger(TenantContextInterceptor_1.name);
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const headerTenantId = request.headers['x-tenant-id'];
        const tenantId = request.params?.tenantId ||
            request.body?.tenantId ||
            (Array.isArray(headerTenantId) ? headerTenantId[0] : headerTenantId) ||
            request.user?.tenantId ||
            null;
        request.tenantId = tenantId;
        if (!tenantId) {
            if (!request.user) {
                this.logger.warn('Warning: request.user is missing when trying to access tenantId', { path: request.path });
            }
            if (process.env.NODE_ENV !== 'test') {
                this.logger.warn('Warning: tenantId is missing in request context', {
                    path: request.path,
                    method: request.method,
                });
            }
        }
        return next.handle().pipe((0, operators_1.tap)({
            error: (error) => {
                if (isTenantError(error)) {
                    this.logger.error(`Error processing request with tenant context: ${error.message}`, {
                        tenantId,
                        path: request.path,
                        status: error.status,
                        stack: error.stack,
                    });
                }
                else {
                    this.logger.error('Unknown error processing request with tenant context', {
                        tenantId,
                        path: request.path,
                        error: String(error),
                    });
                }
            },
        }));
    }
};
exports.TenantContextInterceptor = TenantContextInterceptor;
exports.TenantContextInterceptor = TenantContextInterceptor = TenantContextInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], TenantContextInterceptor);
//# sourceMappingURL=tenant-context.interceptor.js.map