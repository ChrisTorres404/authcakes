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
exports.JwtRefreshStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const token_service_1 = require("../services/token.service");
const users_service_1 = require("../../users/services/users.service");
const session_service_1 = require("../services/session.service");
let JwtRefreshStrategy = class JwtRefreshStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-refresh') {
    configService;
    tokenService;
    usersService;
    sessionService;
    constructor(configService, tokenService, usersService, sessionService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                (request) => request?.cookies?.refresh_token || null,
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get('auth.jwt.secret'),
            passReqToCallback: true,
        });
        this.configService = configService;
        this.tokenService = tokenService;
        this.usersService = usersService;
        this.sessionService = sessionService;
    }
    async validate(request, payload) {
        if (payload.type !== 'refresh') {
            throw new common_1.UnauthorizedException('Not a refresh token');
        }
        const refreshToken = (request.cookies?.refresh_token ?? '');
        if (typeof refreshToken !== 'string' || !refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token missing or invalid');
        }
        const isValid = await this.tokenService.isRefreshTokenValid(refreshToken);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid or revoked refresh token');
        }
        let user = null;
        try {
            user = await this.usersService.findById(payload.sub);
        }
        catch {
            user = null;
        }
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const sessionValid = await this.sessionService.isSessionValid(payload.sub, payload.sessionId);
        if (!sessionValid) {
            throw new common_1.UnauthorizedException('Session is invalid or expired');
        }
        const typedRequest = request;
        typedRequest.sessionId = payload.sessionId;
        typedRequest.userId = payload.sub;
        const result = {
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: payload.tenantId,
            tenantAccess: payload.tenantAccess,
            sessionId: payload.sessionId,
            type: 'refresh',
        };
        return result;
    }
};
exports.JwtRefreshStrategy = JwtRefreshStrategy;
exports.JwtRefreshStrategy = JwtRefreshStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        token_service_1.TokenService,
        users_service_1.UsersService,
        session_service_1.SessionService])
], JwtRefreshStrategy);
//# sourceMappingURL=jwt-refresh.strategy.js.map