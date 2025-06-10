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
const speakeasy = require("speakeasy");
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
const change_password_dto_1 = require("../dto/change-password.dto");
const throttle_decorator_1 = require("../../../common/decorators/throttle.decorator");
const swagger_1 = require("@nestjs/swagger");
const login_response_dto_1 = require("../dto/login-response.dto");
const success_response_dto_1 = require("../dto/success-response.dto");
const token_response_dto_1 = require("../dto/token-response.dto");
const session_status_response_dto_1 = require("../dto/session-status-response.dto");
const session_list_response_dto_1 = require("../dto/session-list-response.dto");
const verify_email_response_dto_1 = require("../dto/verify-email-response.dto");
const reset_password_response_dto_1 = require("../dto/reset-password-response.dto");
const forgot_password_response_dto_1 = require("../dto/forgot-password-response.dto");
const account_recovery_response_dto_1 = require("../dto/account-recovery-response.dto");
const change_password_response_dto_1 = require("../dto/change-password-response.dto");
const mfa_response_dto_1 = require("../dto/mfa-response.dto");
const mfa_verify_dto_1 = require("../dto/mfa-verify.dto");
const social_login_response_dto_1 = require("../dto/social-login-response.dto");
const audit_logs_response_dto_1 = require("../dto/audit-logs-response.dto");
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
    async login(_loginDto, req, res) {
        const deviceInfo = this.extractDeviceInfo(req);
        const { accessToken, refreshToken, sessionId, user } = await this.tokenService.generateTokens(req.user.id, deviceInfo);
        this.setAuthCookies(res, { accessToken, refreshToken, sessionId });
        return {
            success: true,
            user: {
                id: user.id || '',
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                role: user.role || 'user',
                avatar: user.avatar || undefined,
                emailVerified: user.emailVerified || false,
            },
            sessionId,
            accessToken,
            refreshToken,
        };
    }
    async logout(req, res) {
        if (process.env.NODE_ENV === 'test') {
            console.log('Logout endpoint - cookies:', req.cookies);
            console.log('Logout endpoint - user:', req.user);
        }
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
        if (!oldSessionId) {
            throw new common_1.UnauthorizedException('Invalid session');
        }
        const { accessToken, refreshToken, user } = await this.authService.refresh(userId, oldSessionId, deviceInfo);
        this.setAuthCookies(res, {
            accessToken,
            refreshToken,
            sessionId: oldSessionId,
        });
        return {
            success: true,
            user: {
                id: user.id || '',
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                role: user.role || 'user',
                avatar: user.avatar || undefined,
                emailVerified: user.emailVerified || false,
            },
            accessToken,
            refreshToken,
        };
    }
    async checkSessionStatus(req) {
        const userId = req.user.id ?? '';
        const sessionId = req.user.sessionId ?? '';
        const sessionValid = await this.sessionService.isSessionValid(userId, sessionId);
        if (!sessionValid) {
            return {
                valid: false,
                remainingSeconds: 0,
                sessionId: '',
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
            sessions: sessions.map((session) => ({
                id: session.id,
                createdAt: session.createdAt.toISOString(),
                deviceInfo: session.deviceInfo,
                lastUsedAt: session.lastUsedAt?.toISOString() || session.createdAt.toISOString(),
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
        const { accessToken, refreshToken, sessionId, user, verificationToken } = await this.authService.register(registerDto, deviceInfo);
        this.setAuthCookies(res, { accessToken, refreshToken, sessionId });
        return {
            success: true,
            user: {
                id: user.id || '',
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                role: user.role || 'user',
                avatar: user.avatar || undefined,
                emailVerified: user.emailVerified || false,
            },
            sessionId,
            accessToken,
            refreshToken,
            verificationToken,
        };
    }
    async verifyEmail(token) {
        const user = await this.authService.verifyEmail(token);
        return {
            success: true,
            user: {
                id: user.id || '',
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                role: user.role || 'user',
                emailVerified: user.emailVerified || false,
            }
        };
    }
    async forgotPassword(dto) {
        const token = await this.authService.requestPasswordReset(dto.email);
        return { success: true, tokenSent: !!token };
    }
    async resetPassword(dto) {
        const user = await this.authService.resetPassword(dto.token, dto.password, dto.otp);
        return {
            success: true,
            user: {
                id: user.id || '',
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                role: user.role || 'user',
                emailVerified: user.emailVerified || false,
            }
        };
    }
    async requestAccountRecovery(dto, req, res) {
        const result = await this.authService.requestAccountRecovery(dto.email);
        res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.header('X-Request-ID', req.headers['x-request-id'] || Math.random().toString(36));
        return result;
    }
    async completeAccountRecovery(dto, req, res) {
        const result = await this.authService.completeAccountRecovery(dto.token, dto.newPassword, dto.mfaCode);
        res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.header('X-Request-ID', req.headers['x-request-id'] || Math.random().toString(36));
        return result;
    }
    async changePassword(req, dto) {
        const userId = req.user.id;
        const result = await this.authService.changePassword(userId, dto.oldPassword, dto.newPassword);
        await this.sessionService.revokeAllUserSessions(userId);
        await this.tokenService.revokeAllUserTokens(userId);
        return { success: true, ...result };
    }
    async mfaEnroll(req) {
        const jwtUser = req.user;
        if (jwtUser && jwtUser.sub && !jwtUser.id) {
            jwtUser.id = jwtUser.sub;
        }
        if (!jwtUser || !jwtUser.id) {
            throw new common_1.UnauthorizedException('User context missing or invalid in MFA enrollment');
        }
        const secret = speakeasy.generateSecret({
            length: 20,
            name: `AuthCakes:${req.user.email}`,
            issuer: 'AuthCakes',
        });
        if (!secret.base32) {
            throw new Error('Failed to generate MFA secret');
        }
        await this.authService.setMfaSecret(req.user.id, secret.base32);
        return {
            success: true,
            secret: secret.base32,
            ...(secret.otpauth_url && { otpauth_url: secret.otpauth_url }),
            setupStatus: 'pending',
        };
    }
    async mfaVerify(req, verifyDto) {
        const userId = req.user?.id || req.user?.sub;
        if (!userId) {
            return { success: false, message: 'User not authenticated' };
        }
        if (verifyDto.type === 'recovery') {
            const isValid = await this.authService.verifyRecoveryCode(userId, verifyDto.code);
            if (isValid) {
                return { success: true };
            }
            return { success: false, message: 'Invalid recovery code' };
        }
        const user = await this.authService.getUserById(userId);
        const secret = user.mfaSecret;
        if (!secret) {
            return { success: false, message: 'No MFA secret set' };
        }
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token: verifyDto.code,
            window: 1,
        });
        if (verified) {
            if (!user.mfaEnabled) {
                const recoveryCodes = await this.authService.enableMfa(userId);
                return {
                    success: true,
                    recoveryCodes,
                    message: 'MFA enabled successfully. Save these recovery codes in a safe place.'
                };
            }
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
            ip: req.ip || '',
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
    (0, swagger_1.ApiOperation)({ summary: 'Login with email and password' }),
    (0, swagger_1.ApiBody)({ type: login_dto_1.LoginDto }),
    (0, swagger_1.ApiOkResponse)({
        type: login_response_dto_1.LoginResponseDto,
        description: 'Successful login returns user info and tokens.',
    }),
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
    (0, swagger_1.ApiOperation)({
        summary: 'Logout the current user and clear authentication cookies.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: success_response_dto_1.SuccessResponseDto,
        description: 'Logout successful.',
    }),
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
    (0, swagger_1.ApiOperation)({
        summary: 'Refresh access and refresh tokens using a valid refresh token.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: token_response_dto_1.TokenResponseDto,
        description: 'Returns new access and refresh tokens, and user info.',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('session-status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Check if the current session is valid and get remaining time.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: session_status_response_dto_1.SessionStatusResponseDto,
        description: 'Session validity and remaining time.',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "checkSessionStatus", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'List all active sessions for the current user.' }),
    (0, swagger_1.ApiOkResponse)({
        type: session_list_response_dto_1.SessionListResponseDto,
        description: 'List of active sessions.',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "listSessions", null);
__decorate([
    (0, common_1.Post)('revoke-session'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke a specific session for the current user.' }),
    (0, swagger_1.ApiBody)({ type: revoke_session_dto_1.RevokeSessionDto }),
    (0, swagger_1.ApiOkResponse)({
        type: success_response_dto_1.SuccessResponseDto,
        description: 'Session revoked successfully.',
    }),
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
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user account.' }),
    (0, swagger_1.ApiBody)({ type: register_dto_1.RegisterDto }),
    (0, swagger_1.ApiOkResponse)({
        type: login_response_dto_1.LoginResponseDto,
        description: 'Registration successful, returns user info and tokens.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Invalid input or weak password.' }),
    (0, swagger_1.ApiConflictResponse)({ description: 'Email already in use.' }),
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
    (0, swagger_1.ApiOperation)({ summary: 'Verify user email with a token.' }),
    (0, swagger_1.ApiBody)({ schema: { example: { token: 'verification-token' } } }),
    (0, swagger_1.ApiOkResponse)({
        type: verify_email_response_dto_1.VerifyEmailResponseDto,
        description: 'Email verified and user info returned.'
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid or expired verification token.',
    }),
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
    (0, swagger_1.ApiOperation)({ summary: 'Request a password reset email.' }),
    (0, swagger_1.ApiBody)({ type: forgot_password_dto_1.ForgotPasswordDto }),
    (0, swagger_1.ApiOkResponse)({
        type: forgot_password_response_dto_1.ForgotPasswordResponseDto,
        description: 'Password reset token sent if email exists.'
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Invalid email or user not found.' }),
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
    (0, swagger_1.ApiOperation)({ summary: 'Reset password using a token and optional OTP.' }),
    (0, swagger_1.ApiOkResponse)({
        type: reset_password_response_dto_1.ResetPasswordResponseDto,
        description: 'Password reset and user info returned.'
    }),
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
    (0, swagger_1.ApiOperation)({
        summary: 'Request account recovery when all credentials are lost.',
    }),
    (0, swagger_1.ApiBody)({ type: request_account_recovery_dto_1.RequestAccountRecoveryDto }),
    (0, swagger_1.ApiOkResponse)({
        type: account_recovery_response_dto_1.RequestAccountRecoveryResponseDto,
        description: 'Account recovery token sent if email exists.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Invalid email or user not found.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_account_recovery_dto_1.RequestAccountRecoveryDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestAccountRecovery", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttle_decorator_1.ThrottlePasswordReset)(),
    (0, common_1.Post)('complete-account-recovery'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Complete account recovery by setting a new password with a recovery token.',
    }),
    (0, swagger_1.ApiBody)({ type: complete_account_recovery_dto_1.CompleteAccountRecoveryDto }),
    (0, swagger_1.ApiOkResponse)({
        type: account_recovery_response_dto_1.CompleteAccountRecoveryResponseDto,
        description: 'Account recovery completed.'
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid token, password, or MFA code.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [complete_account_recovery_dto_1.CompleteAccountRecoveryDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "completeAccountRecovery", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Change password for the current user.' }),
    (0, swagger_1.ApiBody)({ type: change_password_dto_1.ChangePasswordDto }),
    (0, swagger_1.ApiOkResponse)({
        type: change_password_response_dto_1.ChangePasswordResponseDto,
        description: 'Password changed and all sessions/tokens revoked.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Invalid input or weak password.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('mfa/enroll'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Enroll in multi-factor authentication (MFA).' }),
    (0, swagger_1.ApiOkResponse)({
        type: mfa_response_dto_1.MfaEnrollResponseDto,
        description: 'MFA enrollment secret and URL returned.',
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'User is not authenticated.' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "mfaEnroll", null);
__decorate([
    (0, common_1.Post)('mfa/verify'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Verify MFA code to enable MFA.' }),
    (0, swagger_1.ApiBody)({ type: mfa_verify_dto_1.MfaVerifyDto }),
    (0, swagger_1.ApiOkResponse)({
        type: mfa_response_dto_1.MfaVerifyResponseDto,
        description: 'MFA enabled if code is valid.',
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'User is not authenticated.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mfa_verify_dto_1.MfaVerifyDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "mfaVerify", null);
__decorate([
    (0, common_1.Post)('social'),
    (0, swagger_1.ApiOperation)({
        summary: 'Social login (not implemented).',
        description: 'This endpoint is a stub and does not perform social login.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: social_login_response_dto_1.SocialLoginResponseDto,
        description: 'Social login not implemented yet.',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "socialLogin", null);
__decorate([
    (0, common_1.Get)('/audit-logs'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get audit logs (not implemented).',
        description: 'This endpoint is a stub and does not return audit logs.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: audit_logs_response_dto_1.AuditLogsResponseDto,
        description: 'Audit logs not implemented yet.',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "auditLogs", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('v1/auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        token_service_1.TokenService,
        session_service_1.SessionService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map