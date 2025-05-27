import { UsersService } from '../../users/services/users.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { JwtService } from '@nestjs/jwt';
import { AuditLogService } from './audit-log.service';
import { NotificationService } from './notification.service';
import { PasswordHistoryService } from './password-history.service';
import { SettingsService } from '../../settings/services/settings.service';
import { ConfigService } from '@nestjs/config';
import { TenantsService } from '../../tenants/services/tenants.service';
export declare class AuthService {
    private readonly usersService;
    private readonly tokenService;
    private readonly sessionService;
    private readonly jwtService;
    private readonly auditLogService;
    private readonly notificationService;
    private readonly passwordHistoryService;
    private readonly settingsService;
    private readonly configService;
    private readonly tenantsService;
    private readonly logger;
    private readonly isProduction;
    constructor(usersService: UsersService, tokenService: TokenService, sessionService: SessionService, jwtService: JwtService, auditLogService: AuditLogService, notificationService: NotificationService, passwordHistoryService: PasswordHistoryService, settingsService: SettingsService, configService: ConfigService, tenantsService: TenantsService);
    validateUser(email: string, password: string): Promise<import("../../users/entities/user.entity").User>;
    register(registerDto: any, deviceInfo?: any): Promise<{
        verificationToken: string;
        accessToken: string;
        refreshToken: string;
        sessionId: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
            avatar: string;
            emailVerified: boolean;
        };
    }>;
    refresh(userId: string, sessionId: string, deviceInfo?: any): Promise<{
        accessToken: string;
        refreshToken: string;
        sessionId: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
            avatar: string;
            emailVerified: boolean;
        };
    }>;
    requestEmailVerification(userId: string): Promise<string>;
    verifyEmail(token: string): Promise<import("../../users/entities/user.entity").User>;
    requestPasswordReset(email: string): Promise<string>;
    private isPasswordInHistory;
    resetPassword(token: string, newPassword: string, otp?: string): Promise<import("../../users/entities/user.entity").User>;
    requestAccountRecovery(email: string): Promise<{
        recoveryToken?: string | undefined;
        success: boolean;
    }>;
    completeAccountRecovery(token: string, newPassword: string, mfaCode?: string): Promise<{
        success: boolean;
    }>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    validateMfaCode(user: any, code: string): Promise<boolean>;
    setMfaSecret(userId: string, secret: string): Promise<void>;
    getUserById(userId: string): Promise<import("../../users/entities/user.entity").User>;
    enableMfa(userId: string): Promise<void>;
}
