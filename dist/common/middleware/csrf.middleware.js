"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsrfMiddleware = void 0;
exports.getCsrfToken = getCsrfToken;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
let CsrfMiddleware = class CsrfMiddleware {
    CSRF_HEADER = 'x-csrf-token';
    CSRF_COOKIE = '_csrf';
    TOKEN_LENGTH = 32;
    SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
    use(req, res, next) {
        if (this.SAFE_METHODS.includes(req.method)) {
            return next();
        }
        if (req.headers.authorization?.startsWith('Bearer ')) {
            return next();
        }
        const cookieToken = req.cookies[this.CSRF_COOKIE];
        const headerToken = req.headers[this.CSRF_HEADER];
        if (!cookieToken) {
            const newToken = this.generateToken();
            res.cookie(this.CSRF_COOKIE, newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 86400000,
            });
            res.setHeader(this.CSRF_HEADER, newToken);
            return next();
        }
        if (!headerToken || !this.validateToken(cookieToken, headerToken)) {
            throw new common_1.ForbiddenException('Invalid CSRF token');
        }
        next();
    }
    generateToken() {
        return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
    }
    validateToken(cookieToken, headerToken) {
        return crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
    }
};
exports.CsrfMiddleware = CsrfMiddleware;
exports.CsrfMiddleware = CsrfMiddleware = __decorate([
    (0, common_1.Injectable)()
], CsrfMiddleware);
function getCsrfToken(req) {
    return req.cookies['_csrf'];
}
//# sourceMappingURL=csrf.middleware.js.map