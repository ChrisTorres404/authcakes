"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemAuth = SystemAuth;
exports.SystemAndUserAuth = SystemAndUserAuth;
exports.UserAuth = UserAuth;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const system_auth_guard_1 = require("../guards/system-auth.guard");
const jwt_auth_guard_1 = require("../../modules/auth/guards/jwt-auth.guard");
function SystemAuth() {
    return (0, common_1.applyDecorators)((0, common_1.UseGuards)(system_auth_guard_1.SystemAuthGuard), (0, swagger_1.ApiSecurity)('SystemApiKey'), (0, swagger_1.ApiSecurity)('SystemJWT'));
}
function SystemAndUserAuth() {
    return (0, common_1.applyDecorators)((0, common_1.UseGuards)(system_auth_guard_1.SystemAuthGuard, jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiSecurity)('SystemApiKey'), (0, swagger_1.ApiSecurity)('SystemJWT'), (0, swagger_1.ApiSecurity)('UserJWT'));
}
function UserAuth() {
    return (0, common_1.applyDecorators)((0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiSecurity)('UserJWT'));
}
//# sourceMappingURL=system-auth.decorator.js.map