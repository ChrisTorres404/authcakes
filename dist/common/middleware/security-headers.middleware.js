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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityHeadersMiddleware = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SecurityHeadersMiddleware = class SecurityHeadersMiddleware {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    use(req, res, next) {
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');
        const hstsMaxAge = this.configService.get('HSTS_MAX_AGE', 31536000);
        res.setHeader('Strict-Transport-Security', `max-age=${hstsMaxAge}; includeSubDomains; preload`);
        const cspDefaultSrc = this.configService.get('CSP_DEFAULT_SRC', "'self'");
        const cspScriptSrc = this.configService.get('CSP_SCRIPT_SRC', "'self'");
        const cspStyleSrc = this.configService.get('CSP_STYLE_SRC', "'self' 'unsafe-inline'");
        const cspImgSrc = this.configService.get('CSP_IMG_SRC', "'self' data: https:");
        const cspPolicy = [
            `default-src ${cspDefaultSrc}`,
            `script-src ${cspScriptSrc}`,
            `style-src ${cspStyleSrc}`,
            `img-src ${cspImgSrc}`,
            `font-src 'self'`,
            `connect-src 'self'`,
            `frame-ancestors 'none'`,
            `form-action 'self'`,
            `base-uri 'self'`,
            `object-src 'none'`,
            `media-src 'self'`,
        ].join('; ');
        res.setHeader('Content-Security-Policy', cspPolicy);
        const xFrameOptions = this.configService.get('X_FRAME_OPTIONS', 'DENY');
        res.setHeader('X-Frame-Options', xFrameOptions);
        const xContentTypeOptions = this.configService.get('X_CONTENT_TYPE_OPTIONS', 'nosniff');
        res.setHeader('X-Content-Type-Options', xContentTypeOptions);
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        const permissionsPolicy = [
            'camera=()',
            'microphone=()',
            'geolocation=()',
            'payment=()',
            'usb=()',
            'magnetometer=()',
            'accelerometer=()',
            'gyroscope=()',
        ].join(', ');
        res.setHeader('Permissions-Policy', permissionsPolicy);
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        if (this.isSensitiveEndpoint(req.path)) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Surrogate-Control', 'no-store');
        }
        res.setHeader('X-Content-Security-Policy', cspPolicy);
        res.setHeader('X-WebKit-CSP', cspPolicy);
        res.setHeader('X-DNS-Prefetch-Control', 'off');
        res.setHeader('X-Download-Options', 'noopen');
        res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
        res.setHeader('X-Security-Level', 'enterprise');
        res.setHeader('X-API-Version', '1.0');
        next();
    }
    isSensitiveEndpoint(path) {
        const sensitivePatterns = [
            '/auth/',
            '/users/',
            '/admin/',
            '/settings/',
            '/tenants/',
        ];
        return sensitivePatterns.some(pattern => path.includes(pattern));
    }
};
exports.SecurityHeadersMiddleware = SecurityHeadersMiddleware;
exports.SecurityHeadersMiddleware = SecurityHeadersMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SecurityHeadersMiddleware);
//# sourceMappingURL=security-headers.middleware.js.map