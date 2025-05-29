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
import { User } from '../../users/entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { DeviceInfo, AuthTokenResponse } from '../interfaces/auth.interfaces';
interface AccountRecoveryResponse {
    success: boolean;
    recoveryToken?: string;
    message?: string;
}
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
    validateUser(email: string, password: string): Promise<User>;
    register(registerDto: RegisterDto, deviceInfo?: DeviceInfo): Promise<AuthTokenResponse>;
    refresh(userId: string, sessionId: string, deviceInfo?: DeviceInfo): Promise<AuthTokenResponse>;
    requestEmailVerification(userId: string): Promise<string>;
    verifyEmail(token: string): Promise<User>;
    requestPasswordReset(email: string): Promise<string>;
    private isPasswordInHistory;
    resetPassword(token: string, newPassword: string, otp?: string): Promise<User>;
    requestAccountRecovery(email: string): Promise<AccountRecoveryResponse>;
    completeAccountRecovery(token: string, newPassword: string, mfaCode?: string): Promise<{
        success: boolean;
    }>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    validateMfaCode(user: User, code: string): boolean;
    setMfaSecret(userId: string, secret: string): Promise<void>;
    getUserById(userId: string): Promise<User>;
    enableMfa(userId: string): Promise<void>;
}
export {};
