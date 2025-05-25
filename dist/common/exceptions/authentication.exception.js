"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationException = void 0;
const common_1 = require("@nestjs/common");
class AuthenticationException extends common_1.HttpException {
    constructor(message = 'Authentication failed', errorCode = 'AUTH_ERROR') {
        super({ message, errorCode }, common_1.HttpStatus.UNAUTHORIZED);
    }
}
exports.AuthenticationException = AuthenticationException;
//# sourceMappingURL=authentication.exception.js.map