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
var JwtStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const users_service_1 = require("../../users/services/users.service");
const session_service_1 = require("../services/session.service");
let JwtStrategy = JwtStrategy_1 = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt') {
    configService;
    usersService;
    sessionService;
    logger = new common_1.Logger(JwtStrategy_1.name);
    constructor(configService, usersService, sessionService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
                (request) => {
                    const token = request?.cookies?.access_token || null;
                    if (process.env.NODE_ENV === 'test') {
                        console.log('JWT Cookie extraction - cookies:', request?.cookies);
                        console.log('JWT Cookie extraction - token:', token ? 'found' : 'not found');
                    }
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
        const startTime = Date.now();
        const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        try {
            this.logger.log(`JWT validation started - RequestID: ${requestId}, User: ${payload.sub}, URL: ${request.url}`);
            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                this.logger.warn(`JWT validation failed - User not found - RequestID: ${requestId}, UserID: ${payload.sub}`);
                throw new common_1.UnauthorizedException('User not found');
            }
            if (!user.active) {
                this.logger.warn(`JWT validation failed - Inactive user - RequestID: ${requestId}, UserID: ${payload.sub}`);
                throw new common_1.UnauthorizedException('Account is inactive');
            }
            if (user.lockedUntil && user.lockedUntil > new Date()) {
                this.logger.warn(`JWT validation failed - Account locked - RequestID: ${requestId}, UserID: ${payload.sub}, LockedUntil: ${user.lockedUntil}`);
                throw new common_1.UnauthorizedException('Account is temporarily locked');
            }
            if (payload.sessionId) {
                const session = await this.sessionService?.getSessionById(payload.sessionId);
                const sessionValid = await this.sessionService?.isSessionValid(user.id, payload.sessionId) ?? false;
                if (!session) {
                    this.logger.warn(`JWT validation failed - Session not found - RequestID: ${requestId}, UserID: ${payload.sub}, SessionID: ${payload.sessionId}`);
                    throw new common_1.UnauthorizedException('Session not found');
                }
                if (session.revoked) {
                    this.logger.warn(`JWT validation failed - Session revoked - RequestID: ${requestId}, UserID: ${payload.sub}, SessionID: ${payload.sessionId}`);
                    throw new common_1.UnauthorizedException('Session has been revoked');
                }
                if (session.expiresAt && session.expiresAt < new Date()) {
                    this.logger.warn(`JWT validation failed - Session expired - RequestID: ${requestId}, UserID: ${payload.sub}, SessionID: ${payload.sessionId}, ExpiredAt: ${session.expiresAt}`);
                    throw new common_1.UnauthorizedException('Session has expired');
                }
                if (!sessionValid) {
                    this.logger.warn(`JWT validation failed - Invalid session - RequestID: ${requestId}, UserID: ${payload.sub}, SessionID: ${payload.sessionId}`);
                    throw new common_1.UnauthorizedException('Session is invalid');
                }
            }
            const typedRequest = request;
            typedRequest.tenantId = payload.tenantId ?? undefined;
            typedRequest.tenantAccess = payload.tenantAccess;
            typedRequest.sessionId = payload.sessionId;
            const duration = Date.now() - startTime;
            this.logger.log(`JWT validation successful - RequestID: ${requestId}, UserID: ${payload.sub}, Duration: ${duration}ms`);
            return {
                ...payload,
                tenantAccess: payload.tenantAccess || [],
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error(`JWT validation error - RequestID: ${requestId}, Duration: ${duration}ms, Error: ${error.message}`);
            throw error;
        }
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = JwtStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        users_service_1.UsersService,
        session_service_1.SessionService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map