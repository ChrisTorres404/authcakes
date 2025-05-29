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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../../users/services/users.service");
const token_service_1 = require("./token.service");
const session_service_1 = require("./session.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const audit_log_service_1 = require("./audit-log.service");
const notification_service_1 = require("./notification.service");
const password_history_service_1 = require("./password-history.service");
const settings_service_1 = require("../../settings/services/settings.service");
const config_1 = require("@nestjs/config");
const tenants_service_1 = require("../../tenants/services/tenants.service");
const tenant_invitation_dto_1 = require("../../tenants/dto/tenant-invitation.dto");
function hasValidMfaConfig(user) {
    return (user.mfaEnabled &&
        user.mfaType !== null &&
        (user.mfaType === 'totp' || user.mfaType === 'sms'));
}
let AuthService = AuthService_1 = class AuthService {
    usersService;
    tokenService;
    sessionService;
    jwtService;
    auditLogService;
    notificationService;
    passwordHistoryService;
    settingsService;
    configService;
    tenantsService;
    logger = new common_1.Logger(AuthService_1.name);
    isProduction;
    constructor(usersService, tokenService, sessionService, jwtService, auditLogService, notificationService, passwordHistoryService, settingsService, configService, tenantsService) {
        this.usersService = usersService;
        this.tokenService = tokenService;
        this.sessionService = sessionService;
        this.jwtService = jwtService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
        this.passwordHistoryService = passwordHistoryService;
        this.settingsService = settingsService;
        this.configService = configService;
        this.tenantsService = tenantsService;
        this.isProduction =
            this.configService.get('NODE_ENV') === 'production';
    }
    async validateUser(email, password) {
        const user = await this.usersService.findByEmail(email);
        console.log('[validateUser] Lookup for email:', email, 'Result:', user);
        if (!user) {
            await this.usersService.recordFailedLoginAttempt(email);
            console.log('[validateUser] Login failed: user not found');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            console.log('[validateUser] Login failed: account locked until', user.lockedUntil);
            throw new common_1.ForbiddenException('Account is locked. Try again later.');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('[validateUser] Password match:', isMatch);
        if (!isMatch) {
            await this.usersService.recordFailedLoginAttempt(user.id);
            console.log('[validateUser] Login failed: password mismatch');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.usersService.resetFailedLoginAttempts(user.id);
        await this.usersService.updateLastLogin(user.id);
        console.log('[validateUser] Login success for user:', user.id);
        return user;
    }
    async register(registerDto, deviceInfo = { ip: '', userAgent: '' }) {
        const existing = await this.usersService.findByEmail(registerDto.email);
        if (existing)
            throw new common_1.BadRequestException('Email already in use');
        const user = await this.usersService.create(registerDto);
        let tenant = null;
        if (registerDto.organizationName) {
            const slug = registerDto.organizationName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            tenant = await this.tenantsService.create({
                name: registerDto.organizationName,
                slug,
                active: true,
            });
            await this.tenantsService.addUserToTenant(user.id, tenant.id, tenant_invitation_dto_1.TenantRole.ADMIN);
        }
        await this.passwordHistoryService.addToHistory(user.id, user.password);
        const verificationToken = await this.requestEmailVerification(user.id);
        const tokens = await this.tokenService.generateTokens(user.id, deviceInfo);
        return { ...tokens, verificationToken };
    }
    async refresh(userId, sessionId, deviceInfo = { ip: '', userAgent: '' }) {
        const tokens = await this.tokenService.generateTokens(userId, deviceInfo);
        return tokens;
    }
    async requestEmailVerification(userId) {
        const token = await this.usersService.generateEmailVerificationToken(userId);
        return token;
    }
    async verifyEmail(token) {
        return this.usersService.verifyEmail(token);
    }
    async requestPasswordReset(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const token = await this.usersService.generatePasswordResetToken(user.id);
        const updatedUser = await this.usersService.findById(user.id);
        if (updatedUser.otp) {
            this.notificationService.sendPasswordResetOtp(updatedUser.email, updatedUser.otp);
        }
        return token;
    }
    async isPasswordInHistory(userId, newPassword) {
        const historyCount = await this.settingsService.getValue('account.password_history_count', 5);
        return this.passwordHistoryService.isPasswordInHistory(userId, newPassword, historyCount);
    }
    async resetPassword(token, newPassword, otp) {
        await this.auditLogService.log('password_reset_attempt', { token });
        const user = await this.usersService.findByPasswordResetToken(token);
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired token');
        }
        const passwordInHistory = await this.isPasswordInHistory(user.id, newPassword);
        if (passwordInHistory) {
            throw new common_1.ConflictException('Cannot reuse a previous password');
        }
        const updatedUser = await this.usersService.resetPassword(token, newPassword, otp);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.passwordHistoryService.addToHistory(updatedUser.id, hashedPassword);
        await this.sessionService.revokeAllUserSessions(updatedUser.id);
        await this.tokenService.revokeAllUserTokens(updatedUser.id);
        await this.auditLogService.log('password_reset_success', {
            userId: updatedUser.id,
        });
        await this.notificationService.sendPasswordResetSuccess(updatedUser.email);
        return updatedUser;
    }
    async requestAccountRecovery(email) {
        const user = await this.usersService.findByEmail(email);
        let token;
        let accountExists = false;
        if (user) {
            accountExists = true;
            token = await this.usersService.generateAccountRecoveryToken(user.id);
            await this.auditLogService.log('account_recovery_requested', {
                userId: user.id,
            });
        }
        else {
            await this.auditLogService.log('account_recovery_request_nonexistent', {
                email,
            });
        }
        await this.notificationService.sendRecoveryNotification({
            email,
            token,
            accountExists,
        });
        const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
        return {
            success: true,
            ...(isDev && accountExists && { recoveryToken: token }),
        };
    }
    async completeAccountRecovery(token, newPassword, mfaCode) {
        await this.auditLogService.log('account_recovery_attempt', { token });
        const user = await this.usersService.findByRecoveryToken(token);
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired token');
        }
        if (user.mfaEnabled) {
            const shouldEnforceMfa = this.isProduction ||
                (await this.settingsService.getValue('security.enforce_mfa_in_dev', false));
            if (shouldEnforceMfa) {
                if (!mfaCode) {
                    throw new common_1.UnauthorizedException('MFA code is required for account recovery');
                }
                const isValidMfa = await this.validateMfaCode(user, mfaCode);
                if (!isValidMfa) {
                    await this.auditLogService.log('account_recovery_mfa_failed', {
                        userId: user.id,
                        attempt: 'recovery',
                    });
                    throw new common_1.UnauthorizedException('Invalid MFA code');
                }
            }
        }
        const passwordInHistory = await this.isPasswordInHistory(user.id, newPassword);
        if (passwordInHistory) {
            throw new common_1.ConflictException('Cannot reuse a previous password');
        }
        const updatedUser = await this.usersService.completeAccountRecovery(token, newPassword);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.passwordHistoryService.addToHistory(updatedUser.id, hashedPassword);
        await this.sessionService.revokeAllUserSessions(updatedUser.id);
        await this.tokenService.revokeAllUserTokens(updatedUser.id);
        await this.auditLogService.log('account_recovery_success', {
            userId: updatedUser.id,
        });
        await this.notificationService.sendAccountRecoverySuccess(updatedUser.email);
        return { success: true };
    }
    async changePassword(userId, oldPassword, newPassword) {
        const user = await this.usersService.findById(userId);
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            await this.auditLogService.log('password_change_failed', {
                userId: user.id,
                reason: 'incorrect_old_password',
            });
            throw new common_1.UnauthorizedException('Old password is incorrect');
        }
        const passwordInHistory = await this.isPasswordInHistory(userId, newPassword);
        if (passwordInHistory) {
            await this.auditLogService.log('password_change_failed', {
                userId: user.id,
                reason: 'password_reuse',
            });
            throw new common_1.ConflictException('Cannot reuse a previous password');
        }
        await this.usersService.update(userId, { password: newPassword });
        await this.passwordHistoryService.addToHistory(userId, newPassword);
        await this.auditLogService.log('password_changed', { userId });
        return { message: 'Password changed successfully' };
    }
    validateMfaCode(user, code) {
        if (!hasValidMfaConfig(user))
            return false;
        if (user.mfaType === 'totp') {
            if (!user.mfaSecret)
                return false;
            return speakeasy.totp.verify({
                secret: user.mfaSecret,
                encoding: 'base32',
                token: code,
                window: 1,
            });
        }
        else if (user.mfaType === 'sms') {
            if (!user.smsMfaCode)
                return false;
            return user.smsMfaCode === code;
        }
        return false;
    }
    async setMfaSecret(userId, secret) {
        await this.usersService.update(userId, {
            mfaSecret: secret,
            mfaEnabled: false,
            mfaType: 'totp',
        });
    }
    async getUserById(userId) {
        const user = await this.usersService.findById(userId);
        if (!user)
            throw new common_1.BadRequestException('User not found');
        return user;
    }
    async enableMfa(userId) {
        await this.usersService.update(userId, { mfaEnabled: true });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        token_service_1.TokenService,
        session_service_1.SessionService,
        jwt_1.JwtService,
        audit_log_service_1.AuditLogService,
        notification_service_1.NotificationService,
        password_history_service_1.PasswordHistoryService,
        settings_service_1.SettingsService,
        config_1.ConfigService,
        tenants_service_1.TenantsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map