"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantRoles = exports.REQUIRED_TENANT_ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.REQUIRED_TENANT_ROLES_KEY = 'requiredTenantRoles';
const TenantRoles = (...roles) => (0, common_1.SetMetadata)(exports.REQUIRED_TENANT_ROLES_KEY, roles);
exports.TenantRoles = TenantRoles;
//# sourceMappingURL=tenant-roles.decorator.js.map