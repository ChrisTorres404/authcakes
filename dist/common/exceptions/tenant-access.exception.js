"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantAccessException = void 0;
const common_1 = require("@nestjs/common");
class TenantAccessException extends common_1.HttpException {
    constructor(message = 'Access to tenant denied', errorCode = 'TENANT_ACCESS_DENIED') {
        super({ message, errorCode }, common_1.HttpStatus.FORBIDDEN);
    }
}
exports.TenantAccessException = TenantAccessException;
//# sourceMappingURL=tenant-access.exception.js.map