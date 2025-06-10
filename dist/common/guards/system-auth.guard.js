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
exports.SystemAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const public_decorator_1 = require("../decorators/public.decorator");
let SystemAuthGuard = class SystemAuthGuard {
    reflector;
    configService;
    jwtService;
    constructor(reflector, configService, jwtService) {
        this.reflector = reflector;
        this.configService = configService;
        this.jwtService = jwtService;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        if (request.path === '/api/health' || request.path.includes('/api/docs')) {
            return true;
        }
        const systemApiKey = request.headers['x-system-api-key'];
        const systemJwt = request.headers['x-system-authorization'];
        if (!systemApiKey && !systemJwt) {
            throw new common_1.UnauthorizedException('System authentication required');
        }
        try {
            if (systemApiKey) {
                const validApiKeys = this.configService.get('system.apiKeys', []);
                if (!validApiKeys.includes(systemApiKey)) {
                    throw new common_1.UnauthorizedException('Invalid system API key');
                }
                request['system'] = {
                    authenticated: true,
                    method: 'api-key',
                    keyId: this.hashApiKey(systemApiKey),
                };
                return true;
            }
            if (systemJwt) {
                const systemSecret = this.configService.get('system.jwtSecret');
                const payload = await this.jwtService.verifyAsync(systemJwt, {
                    secret: systemSecret,
                });
                if (payload.type !== 'system' || !payload.clientId) {
                    throw new common_1.UnauthorizedException('Invalid system token');
                }
                const activeClients = this.configService.get('system.activeClients', []);
                if (!activeClients.includes(payload.clientId)) {
                    throw new common_1.UnauthorizedException('Client not authorized');
                }
                request['system'] = {
                    authenticated: true,
                    method: 'jwt',
                    clientId: payload.clientId,
                    issuedAt: payload.iat,
                    expiresAt: payload.exp,
                };
                return true;
            }
        }
        catch (error) {
            throw new common_1.UnauthorizedException('System authentication failed');
        }
        return false;
    }
    hashApiKey(apiKey) {
        return `...${apiKey.slice(-8)}`;
    }
};
exports.SystemAuthGuard = SystemAuthGuard;
exports.SystemAuthGuard = SystemAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        config_1.ConfigService,
        jwt_1.JwtService])
], SystemAuthGuard);
//# sourceMappingURL=system-auth.guard.js.map