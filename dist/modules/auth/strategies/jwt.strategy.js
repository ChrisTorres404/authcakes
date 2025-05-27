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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const users_service_1 = require("../../users/services/users.service");
const session_service_1 = require("../services/session.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt') {
    configService;
    usersService;
    sessionService;
    constructor(configService, usersService, sessionService) {
        console.log('[JWTStrategy] Constructor called');
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
                (request) => {
                    console.log('[JWTStrategy] Custom extractor, request.url:', request?.url, 'headers:', request?.headers);
                    const token = request?.cookies?.access_token;
                    if (!token)
                        return null;
                    return token;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get('auth.jwt.secret'),
            passReqToCallback: true,
        });
        this.configService = configService;
        this.usersService = usersService;
        this.sessionService = sessionService;
    }
    async validate(request, payload) {
        console.log('[JWTStrategy] validate called. Request url:', request.url, 'headers:', request.headers);
        console.log('[JWTStrategy] Request cookies:', request.cookies);
        console.log('[JWTStrategy] Decoded JWT payload:', payload);
        const user = await this.usersService.findById(payload.sub);
        console.log('[JWTStrategy] User lookup result:', user);
        if (!user) {
            console.warn('[JWTStrategy] User not found for sub:', payload.sub);
            throw new common_1.UnauthorizedException('User not found');
        }
        if (payload.sessionId) {
            console.log('[JWTStrategy] Checking session validity for userId:', user.id, 'sessionId:', payload.sessionId);
            let sessionValid = false;
            let session = null;
            if (this.sessionService) {
                session = await this.sessionService.getSessionById(payload.sessionId);
                sessionValid = await this.sessionService.isSessionValid(user.id, payload.sessionId);
            }
            else {
                const sessionService = this.sessionService || request.app?.get('SessionService');
                if (sessionService) {
                    session = await sessionService.getSessionById(payload.sessionId);
                    sessionValid = await sessionService.isSessionValid(user.id, payload.sessionId);
                }
            }
            console.log('[JWTStrategy] Session lookup result:', session);
            if (!session) {
                console.warn('[JWTStrategy] Session not found for sessionId:', payload.sessionId);
            }
            else if (session.revoked) {
                console.warn('[JWTStrategy] Session is revoked:', session);
            }
            else if (session.expiresAt && session.expiresAt < new Date()) {
                console.warn('[JWTStrategy] Session is expired:', session);
            }
            if (!sessionValid) {
                console.warn('[JWTStrategy] Session is not valid for userId:', user.id, 'sessionId:', payload.sessionId);
                throw new common_1.UnauthorizedException('Session is revoked or expired');
            }
        }
        request['tenantId'] = payload.tenantId;
        request['tenantAccess'] = payload.tenantAccess;
        request['sessionId'] = payload.sessionId;
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            tenantId: payload.tenantId,
            tenantAccess: payload.tenantAccess,
            sessionId: payload.sessionId,
            type: payload.type,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        users_service_1.UsersService,
        session_service_1.SessionService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map