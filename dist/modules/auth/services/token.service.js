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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const refresh_token_entity_1 = require("../entities/refresh-token.entity");
const users_service_1 = require("../../users/services/users.service");
const tenants_service_1 = require("../../tenants/services/tenants.service");
const session_service_1 = require("./session.service");
let TokenService = class TokenService {
    jwtService;
    configService;
    usersService;
    tenantsService;
    sessionService;
    refreshTokenRepository;
    constructor(jwtService, configService, usersService, tenantsService, sessionService, refreshTokenRepository) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.usersService = usersService;
        this.tenantsService = tenantsService;
        this.sessionService = sessionService;
        this.refreshTokenRepository = refreshTokenRepository;
    }
    async generateTokens(userId, deviceInfo = {}) {
        const user = await this.usersService.findById(userId);
        if (!user)
            throw new Error('User not found');
        const tenantMemberships = await this.tenantsService.getUserTenantMemberships(userId);
        const defaultTenantId = tenantMemberships.length > 0 ? tenantMemberships[0].tenantId : null;
        const tenantAccess = tenantMemberships.map(tm => tm.tenantId);
        const session = await this.sessionService.createSession({ userId, deviceInfo });
        console.log('[TokenService] Created session with ID:', session.id);
        const payload = {
            sub: userId,
            email: user.email,
            role: user.role,
            tenantId: defaultTenantId,
            tenantAccess,
            sessionId: session.id,
            type: 'access',
        };
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = await this.generateRefreshToken({
            ...payload,
            type: 'refresh'
        });
        return {
            accessToken,
            refreshToken,
            sessionId: session.id,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }
    generateAccessToken(payload) {
        let expiresIn = this.configService.get('auth.jwt.accessExpiresIn');
        expiresIn = parseInt(expiresIn, 10);
        if (!Number.isInteger(expiresIn) || expiresIn <= 0) {
            throw new Error('Invalid access token expiry configuration');
        }
        const token = this.jwtService.sign(payload, { expiresIn });
        const decoded = this.jwtService.decode(token);
        console.log('[TokenService] Access token generated:', {
            expiresIn,
            iat: decoded?.iat,
            exp: decoded?.exp,
            now: Math.floor(Date.now() / 1000),
        });
        return token;
    }
    async generateRefreshToken(payload) {
        let expiresIn = this.configService.get('auth.jwt.refreshExpiresIn');
        expiresIn = parseInt(expiresIn, 10);
        if (!Number.isInteger(expiresIn) || expiresIn <= 0) {
            throw new Error('Invalid refresh token expiry configuration');
        }
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
        const token = this.jwtService.sign({ ...payload, type: 'refresh' }, { expiresIn });
        const decoded = this.jwtService.decode(token);
        console.log('[TokenService] Refresh token generated:', {
            expiresIn,
            iat: decoded?.iat,
            exp: decoded?.exp,
            now: Math.floor(Date.now() / 1000),
        });
        console.log('[TokenService] Saving refresh token for sessionId:', payload.sessionId);
        await this.refreshTokenRepository.save({
            user: { id: payload.sub },
            session: { id: payload.sessionId },
            token: token,
            expiresAt,
        });
        return token;
    }
    verifyToken(token) {
        return this.jwtService.verify(token);
    }
    async isRefreshTokenValid(token) {
        try {
            console.log('[TokenService] isRefreshTokenValid called with token:', token);
            const payload = this.jwtService.verify(token);
            console.log('[TokenService] Decoded refresh token payload:', payload);
            const tokenRecord = await this.refreshTokenRepository.findOne({
                where: {
                    token: token,
                    isRevoked: false
                }
            });
            console.log('[TokenService] Refresh token DB lookup result:', tokenRecord);
            if (!tokenRecord) {
                console.warn('[TokenService] Refresh token not found or revoked in DB');
                return false;
            }
            if (tokenRecord.expiresAt < new Date()) {
                console.warn('[TokenService] Refresh token is expired:', tokenRecord);
                await this.revokeRefreshToken(token);
                return false;
            }
            console.log('[TokenService] Refresh token is valid');
            return true;
        }
        catch (error) {
            console.warn('[TokenService] Error validating refresh token:', error);
            return false;
        }
    }
    async revokeRefreshToken(token, revokedBy, revocationReason) {
        await this.refreshTokenRepository.update({ token: token }, {
            isRevoked: true,
            revokedAt: new Date(),
            revokedBy: revokedBy ?? undefined,
            revocationReason: revocationReason ?? undefined,
        });
    }
    async revokeSession(sessionId, revokedBy, revocationReason) {
        await this.sessionService.revokeSession({ sessionId });
        await this.refreshTokenRepository.update({ session: { id: sessionId } }, {
            isRevoked: true,
            revokedAt: new Date(),
            revokedBy: revokedBy ?? undefined,
            revocationReason: revocationReason ?? undefined,
        });
    }
    async listActiveSessions(userId) {
        return this.sessionService.getActiveSessions(userId);
    }
    async rotateRefreshToken(oldToken, userId, sessionId) {
        await this.revokeRefreshToken(oldToken);
        const user = await this.usersService.findById(userId);
        const tenantMemberships = await this.tenantsService.getUserTenantMemberships(userId);
        const defaultTenantId = tenantMemberships.length > 0 ? tenantMemberships[0].tenantId : null;
        const tenantAccess = tenantMemberships.map(tm => tm.tenantId);
        const payload = {
            sub: userId,
            email: user.email,
            role: user.role,
            tenantId: defaultTenantId,
            tenantAccess,
            sessionId,
            type: 'refresh',
        };
        return this.generateRefreshToken(payload);
    }
    async validateToken(token, type) {
        try {
            const payload = this.jwtService.verify(token);
            if (payload.type !== type) {
                throw new Error(`Token is not a ${type} token`);
            }
            if (type === 'refresh') {
                const tokenRecord = await this.refreshTokenRepository.findOne({
                    where: { token: token, isRevoked: false },
                });
                if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
                    throw new Error('Refresh token is revoked or expired');
                }
            }
            return payload;
        }
        catch (err) {
            throw new Error('Invalid or expired token');
        }
    }
    async revokeAllUserTokens(userId, reason) {
        await this.refreshTokenRepository.update({ user: { id: userId } }, {
            isRevoked: true,
            revokedAt: new Date(),
            revocationReason: reason || 'user_revocation',
        });
    }
    getTokenPayload(token) {
        try {
            return this.jwtService.decode(token);
        }
        catch {
            return null;
        }
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        users_service_1.UsersService,
        tenants_service_1.TenantsService,
        session_service_1.SessionService,
        typeorm_2.Repository])
], TokenService);
//# sourceMappingURL=token.service.js.map