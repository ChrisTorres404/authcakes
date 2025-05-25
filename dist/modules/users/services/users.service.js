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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const user_entity_1 = require("../entities/user.entity");
const session_service_1 = require("../../auth/services/session.service");
const audit_log_service_1 = require("../../auth/services/audit-log.service");
let UsersService = UsersService_1 = class UsersService {
    userRepository;
    configService;
    sessionService;
    auditLogService;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(userRepository, configService, sessionService, auditLogService) {
        this.userRepository = userRepository;
        this.configService = configService;
        this.sessionService = sessionService;
        this.auditLogService = auditLogService;
    }
    async findAll() {
        return this.userRepository.find();
    }
    async findById(id, options) {
        const user = await this.userRepository.findOne({
            where: { id },
            ...options,
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByEmail(email) {
        return this.userRepository.findOne({
            where: { email },
        });
    }
    async findByPasswordResetToken(token) {
        return this.userRepository.findOne({
            where: { resetToken: token },
        });
    }
    async findByRecoveryToken(token) {
        return this.userRepository.findOne({
            where: { accountRecoveryToken: token },
        });
    }
    async create(userData) {
        if (userData.email) {
            const existingUser = await this.findByEmail(userData.email);
            if (existingUser) {
                throw new common_1.BadRequestException('Email already in use');
            }
        }
        if (userData.password) {
            userData.password = await this.hashPassword(userData.password);
        }
        const user = this.userRepository.create(userData);
        return this.userRepository.save(user);
    }
    async update(id, userData) {
        const user = await this.findById(id);
        if (userData.email && userData.email !== user.email) {
            const existingUser = await this.findByEmail(userData.email);
            if (existingUser) {
                throw new common_1.BadRequestException('Email already in use');
            }
        }
        if (userData.password) {
            userData.password = await this.hashPassword(userData.password);
        }
        Object.assign(user, userData);
        return this.userRepository.save(user);
    }
    async delete(id) {
        const user = await this.findById(id);
        await this.userRepository.remove(user);
    }
    async validatePassword(userId, password) {
        const user = await this.findById(userId);
        return bcrypt.compare(password, user.password);
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.findById(userId);
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        user.password = await this.hashPassword(newPassword);
        await this.userRepository.save(user);
        return true;
    }
    async recordFailedLoginAttempt(userIdOrEmail) {
        const query = userIdOrEmail.includes('@')
            ? { email: userIdOrEmail }
            : { id: userIdOrEmail };
        const user = await this.userRepository.findOne({ where: query });
        if (!user) {
            return;
        }
        user.failedLoginAttempts += 1;
        const maxAttempts = this.configService.get('auth.security.maxFailedAttempts', 5);
        if (user.failedLoginAttempts >= maxAttempts) {
            const lockDuration = this.configService.get('auth.security.lockDurationMinutes', 30);
            const lockedUntil = new Date();
            lockedUntil.setMinutes(lockedUntil.getMinutes() + lockDuration);
            user.lockedUntil = lockedUntil;
            this.logger.warn(`Account locked for user ${user.email} due to too many failed login attempts`);
        }
        await this.userRepository.save(user);
    }
    async resetFailedLoginAttempts(id) {
        await this.userRepository.update(id, {
            failedLoginAttempts: 0,
            lockedUntil: null,
        });
    }
    async updateLastLogin(id) {
        await this.userRepository.update(id, {
            lastLogin: new Date(),
        });
    }
    async generateEmailVerificationToken(id) {
        const token = crypto.randomBytes(32).toString('hex');
        await this.userRepository.update(id, {
            emailVerificationToken: token,
        });
        return token;
    }
    async verifyEmail(token) {
        const user = await this.userRepository.findOne({
            where: { emailVerificationToken: token },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid verification token');
        }
        user.emailVerified = true;
        user.emailVerificationToken = null;
        return this.userRepository.save(user);
    }
    async generatePasswordResetToken(id) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiryHours = 24;
        const resetTokenExpiry = new Date();
        resetTokenExpiry.setHours(resetTokenExpiry.getHours() + expiryHours);
        const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        console.log('[UsersService] Generated password reset token:', token, 'for user:', id, 'expires at:', resetTokenExpiry);
        await this.userRepository.update(id, {
            resetToken: token,
            resetTokenExpiry,
            otp,
            otpExpiry,
        });
        return token;
    }
    async generateAccountRecoveryToken(id) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiryHours = 1;
        const accountRecoveryTokenExpiry = new Date();
        accountRecoveryTokenExpiry.setHours(accountRecoveryTokenExpiry.getHours() + expiryHours);
        console.log('[UsersService] Generated account recovery token:', token, 'for user:', id, 'expires at:', accountRecoveryTokenExpiry);
        await this.userRepository.update(id, {
            accountRecoveryToken: token,
            accountRecoveryTokenExpiry,
        });
        return token;
    }
    async validateOtp(user, otp) {
        if (!user.otp || !user.otpExpiry)
            return false;
        if (user.otp !== otp)
            return false;
        if (user.otpExpiry < new Date())
            return false;
        return true;
    }
    async resetPassword(token, newPassword, otp) {
        this.auditLogService.log('password_reset_attempt', { token });
        console.log('[UsersService] Attempting password reset with token:', token);
        const user = await this.userRepository.findOne({
            where: { resetToken: token },
        });
        console.log('[UsersService] User lookup result for reset token:', user);
        if (!user) {
            console.warn('[UsersService] Invalid reset token:', token);
            this.auditLogService.log('password_reset_failure', { token });
            throw new common_1.BadRequestException('Invalid reset token');
        }
        if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
            console.warn('[UsersService] Reset token expired:', user.resetTokenExpiry, 'now:', new Date());
            this.auditLogService.log('password_reset_failure', { userId: user.id, reason: 'expired' });
            throw new common_1.BadRequestException('Reset token has expired');
        }
        if (user.otp && user.otpExpiry) {
            if (!otp || !(await this.validateOtp(user, otp))) {
                this.auditLogService.log('password_reset_failure', { userId: user.id, reason: 'invalid_otp' });
                throw new common_1.BadRequestException('Invalid or expired OTP');
            }
        }
        if (!user.active) {
            this.auditLogService.log('password_reset_failure', { userId: user.id, reason: 'inactive' });
            throw new common_1.BadRequestException('Account is deactivated');
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            this.auditLogService.log('password_reset_failure', { userId: user.id, reason: 'locked' });
            throw new common_1.BadRequestException('Account is locked');
        }
        user.password = await this.hashPassword(newPassword);
        user.resetToken = null;
        user.resetTokenExpiry = null;
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        user.otp = null;
        user.otpExpiry = null;
        this.auditLogService.log('password_reset_success', { userId: user.id });
        return this.userRepository.save(user);
    }
    async hashPassword(password) {
        const saltRounds = this.configService.get('auth.password.bcryptRounds', 10);
        return bcrypt.hash(password, saltRounds);
    }
    async search(query) {
        return this.userRepository.find({
            where: [
                { email: (0, typeorm_2.Like)(`%${query}%`) },
                { firstName: (0, typeorm_2.Like)(`%${query}%`) },
                { lastName: (0, typeorm_2.Like)(`%${query}%`) }
            ]
        });
    }
    async remove(id) {
        const result = await this.userRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
    }
    async verifyPhone(token) {
        const user = await this.userRepository.findOne({
            where: { phoneVerificationToken: token }
        });
        if (!user) {
            throw new common_1.NotFoundException('Invalid verification token');
        }
        user.phoneVerified = true;
        user.phoneVerificationToken = '';
        return this.userRepository.save(user);
    }
    async listActiveSessions(userId) {
        return this.sessionService.getActiveSessions(userId);
    }
    async revokeSession(userId, sessionId) {
        const session = await this.sessionService.getSessionById(sessionId);
        if (!session || session.user.id !== userId) {
            throw new common_1.NotFoundException('Session not found or not owned by user');
        }
        await this.sessionService.revokeSession({ sessionId, revokedBy: userId });
    }
    async completeAccountRecovery(token, newPassword) {
        this.auditLogService.log('account_recovery_attempt', { token });
        console.log('[UsersService] Attempting account recovery with token:', token);
        const user = await this.userRepository.findOne({
            where: { accountRecoveryToken: token },
        });
        if (!user) {
            console.warn('[UsersService] Invalid account recovery token:', token);
            this.auditLogService.log('account_recovery_failure', { token, reason: 'invalid_token' });
            throw new common_1.BadRequestException('Invalid recovery token');
        }
        if (user.accountRecoveryTokenExpiry && user.accountRecoveryTokenExpiry < new Date()) {
            console.warn('[UsersService] Account recovery token expired:', user.accountRecoveryTokenExpiry, 'now:', new Date());
            this.auditLogService.log('account_recovery_failure', { userId: user.id, reason: 'expired' });
            throw new common_1.BadRequestException('Recovery token has expired');
        }
        if (!user.active) {
            this.auditLogService.log('account_recovery_failure', { userId: user.id, reason: 'inactive' });
            throw new common_1.BadRequestException('Account is deactivated');
        }
        user.password = await this.hashPassword(newPassword);
        user.accountRecoveryToken = null;
        user.accountRecoveryTokenExpiry = null;
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        this.auditLogService.log('account_recovery_success', { userId: user.id });
        return this.userRepository.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService,
        session_service_1.SessionService,
        audit_log_service_1.AuditLogService])
], UsersService);
//# sourceMappingURL=users.service.js.map