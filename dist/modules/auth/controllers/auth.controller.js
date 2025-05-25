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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("../services/auth.service");
const token_service_1 = require("../services/token.service");
const session_service_1 = require("../services/session.service");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const local_auth_guard_1 = require("../guards/local-auth.guard");
const jwt_refresh_guard_1 = require("../guards/jwt-refresh.guard");
const login_dto_1 = require("../dto/login.dto");
const register_dto_1 = require("../dto/register.dto");
const forgot_password_dto_1 = require("../dto/forgot-password.dto");
const reset_password_dto_1 = require("../dto/reset-password.dto");
const revoke_session_dto_1 = require("../dto/revoke-session.dto");
const request_account_recovery_dto_1 = require("../dto/request-account-recovery.dto");
const complete_account_recovery_dto_1 = require("../dto/complete-account-recovery.dto");
const throttle_decorator_1 = require("../../../common/decorators/throttle.decorator");
let AuthController = class AuthController {
    authService;
    tokenService;
    sessionService;
    configService;
    constructor(authService, tokenService, sessionService, configService) {
        this.authService = authService;
        this.tokenService = tokenService;
        this.sessionService = sessionService;
        this.configService = configService;
    }
    async login(loginDto, req, res) {
        const deviceInfo = this.extractDeviceInfo(req);
        const { accessToken, refreshToken, sessionId, user } = await this.tokenService.generateTokens(req.user.id, deviceInfo);
        this.setAuthCookies(res, { accessToken, refreshToken, sessionId });
        return {
            success: true,
            user,
            sessionId,
            accessToken,
            refreshToken,
        };
    }
    async logout(req, res) {
        const sessionId = req.user.sessionId;
        if (sessionId) {
            await this.tokenService.revokeSession(sessionId, req.user.id, 'User logout');
        }
        this.clearAuthCookies(res);
        return { success: true };
    }
    async refresh(req, res) {
        const userId = req.user.id;
        const oldSessionId = req.user.sessionId;
        const oldRefreshToken = req.cookies.refresh_token;
        const deviceInfo = this.extractDeviceInfo(req);
        if (oldRefreshToken) {
            await this.tokenService.revokeRefreshToken(oldRefreshToken, userId, 'Refresh token rotation');
        }
        const { accessToken, refreshToken, user } = await this.authService.refresh(userId, oldSessionId, deviceInfo);
        this.setAuthCookies(res, {
            accessToken,
            refreshToken,
            sessionId: oldSessionId
        });
        return { success: true, user, accessToken, refreshToken };
    }
    async checkSessionStatus(req) {
        const userId = req.user.id ?? '';
        const sessionId = req.user.sessionId ?? '';
        const sessionValid = await this.sessionService.isSessionValid(userId, sessionId);
        if (!sessionValid) {
            return {
                valid: false,
                remainingSeconds: 0
            };
        }
        const remainingSeconds = await this.sessionService.getSessionRemainingTime(sessionId);
        return {
            valid: true,
            remainingSeconds,
            sessionId,
        };
    }
    async listSessions(req) {
        const userId = req.user.id;
        const sessions = await this.tokenService.listActiveSessions(userId);
        return {
            sessions: sessions.map(session => ({
                id: session.id,
                createdAt: session.createdAt,
                deviceInfo: session.deviceInfo,
                lastUsedAt: session.lastUsedAt,
            })),
        };
    }
    async revokeSession(dto, req) {
        const userId = req.user.id;
        const session = await this.sessionService.getSessionById(dto.sessionId);
        if (!session || session.userId !== userId) {
            throw new common_1.UnauthorizedException('Session not found or not owned by user');
        }
        await this.tokenService.revokeSession(dto.sessionId, userId, 'User-initiated session revocation');
        return { success: true };
    }
    async register(registerDto, req, res) {
        const deviceInfo = this.extractDeviceInfo(req);
        const { accessToken, refreshToken, sessionId, user } = await this.authService.register(registerDto, deviceInfo);
        this.setAuthCookies(res, { accessToken, refreshToken, sessionId });
        return {
            success: true,
            user,
            sessionId,
            accessToken,
            refreshToken,
        };
    }
    async verifyEmail(token) {
        const user = await this.authService.verifyEmail(token);
        return { success: true, user };
    }
    async forgotPassword(dto) {
        const token = await this.authService.requestPasswordReset(dto.email);
        return { success: true, tokenSent: !!token };
    }
    async resetPassword(dto) {
        const user = await this.authService.resetPassword(dto.token, dto.password, dto.otp);
        return { success: true, user };
    }
    async requestAccountRecovery(dto) {
        const result = await this.authService.requestAccountRecovery(dto.email);
        return result;
    }
    async completeAccountRecovery(dto) {
        const result = await this.authService.completeAccountRecovery(dto.token, dto.newPassword);
        return result;
    }
    async changePassword(req, oldPassword, newPassword) {
        const userId = req.user.id;
        const result = await this.authService.changePassword(userId, oldPassword, newPassword);
        await this.sessionService.revokeAllUserSessions(userId);
        await this.tokenService.revokeAllUserTokens(userId);
        return { success: true, ...result };
    }
    async mfaEnroll(req) {
        const secret = require('speakeasy').generateSecret({ length: 20 });
        await this.authService.setMfaSecret(req.user.id, secret.base32);
        return { success: true, secret: secret.base32, otpauth_url: secret.otpauth_url };
    }
    async mfaVerify(req, code) {
        const user = await this.authService.getUserById(req.user.id);
        const secret = user.mfaSecret;
        if (!secret) {
            return { success: false, message: 'No MFA secret set' };
        }
        const verified = require('speakeasy').totp.verify({
            secret,
            encoding: 'base32',
            token: code,
            window: 1,
        });
        if (verified) {
            await this.authService.enableMfa(req.user.id);
            return { success: true };
        }
        else {
            return { success: false, message: 'Invalid MFA code' };
        }
    }
    async socialLogin() {
        return { success: false, message: 'Social login not implemented yet' };
    }
    async auditLogs() {
        return { success: false, message: 'Audit logs not implemented yet' };
    }
    setAuthCookies(res, { accessToken, refreshToken, sessionId }) {
        const accessTokenTtl = parseInt(this.configService.get('auth.jwt.accessExpiresIn') || '900', 10);
        const refreshTokenTtl = parseInt(this.configService.get('auth.jwt.refreshExpiresIn') || '604800', 10);
        res.cookie('access_token', accessToken, {
            httpOnly: false,
            secure: this.configService.get('app.environment') === 'production',
            sameSite: 'lax',
            maxAge: accessTokenTtl * 1000,
            path: '/',
        });
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: this.configService.get('app.environment') === 'production',
            sameSite: 'strict',
            maxAge: refreshTokenTtl * 1000,
            path: '/api/auth',
        });
        res.cookie('session_id', sessionId, {
            httpOnly: false,
            secure: this.configService.get('app.environment') === 'production',
            sameSite: 'lax',
            maxAge: refreshTokenTtl * 1000,
            path: '/',
        });
    }
    clearAuthCookies(res) {
        res.cookie('access_token', '', { maxAge: 0, path: '/' });
        res.cookie('refresh_token', '', { maxAge: 0, path: '/api/auth' });
        res.cookie('session_id', '', { maxAge: 0, path: '/' });
    }
    extractDeviceInfo(req) {
        return {
            ip: req.ip,
            userAgent: req.headers['user-agent'] || '',
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(local_auth_guard_1.LocalAuthGuard),
    (0, throttle_decorator_1.ThrottleLogin)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(jwt_refresh_guard_1.JwtRefreshGuard),
    (0, throttle_decorator_1.ThrottleRefresh)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('session-status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "checkSessionStatus", null);
__decorate([
    (0, common_1.Get)('sessions'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "listSessions", null);
__decorate([
    (0, common_1.Post)('revoke-session'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [revoke_session_dto_1.RevokeSessionDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "revokeSession", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttle_decorator_1.ThrottleRegister)(),
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('verify-email'),
    __param(0, (0, common_1.Body)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttle_decorator_1.ThrottlePasswordReset)(),
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttle_decorator_1.ThrottlePasswordReset)(),
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttle_decorator_1.ThrottlePasswordReset)(),
    (0, common_1.Post)('request-account-recovery'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_account_recovery_dto_1.RequestAccountRecoveryDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestAccountRecovery", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttle_decorator_1.ThrottlePasswordReset)(),
    (0, common_1.Post)('complete-account-recovery'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [complete_account_recovery_dto_1.CompleteAccountRecoveryDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "completeAccountRecovery", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('oldPassword')),
    __param(2, (0, common_1.Body)('newPassword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('mfa/enroll'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "mfaEnroll", null);
__decorate([
    (0, common_1.Post)('mfa/verify'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "mfaVerify", null);
__decorate([
    (0, common_1.Post)('social'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "socialLogin", null);
__decorate([
    (0, common_1.Get)('/audit-logs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "auditLogs", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        token_service_1.TokenService,
        session_service_1.SessionService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map