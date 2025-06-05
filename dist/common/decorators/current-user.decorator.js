"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.sub || !user.email) {
        throw new common_1.UnauthorizedException('Invalid user context');
    }
    if (typeof user.sub !== 'string' || typeof user.email !== 'string') {
        throw new common_1.UnauthorizedException('Malformed user context');
    }
    return user;
});
//# sourceMappingURL=current-user.decorator.js.map