import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { SessionService } from '../services/session.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { RevokeSessionDto } from '../dto/revoke-session.dto';
import { RequestAccountRecoveryDto } from '../dto/request-account-recovery.dto';
import { CompleteAccountRecoveryDto } from '../dto/complete-account-recovery.dto';
export declare class AuthController {
    private readonly authService;
    private readonly tokenService;
    private readonly sessionService;
    private readonly configService;
    constructor(authService: AuthService, tokenService: TokenService, sessionService: SessionService, configService: ConfigService);
    login(loginDto: LoginDto, req: any, res: Response): Promise<{
        success: boolean;
        user: {
            id: string;
            email: string;
            role: string;
        };
        sessionId: string;
        accessToken: string;
        refreshToken: string;
    }>;
    logout(req: any, res: Response): Promise<{
        success: boolean;
    }>;
    refresh(req: any, res: Response): Promise<{
        success: boolean;
        user: {
            id: string;
            email: string;
            role: string;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    checkSessionStatus(req: any): Promise<{
        valid: boolean;
        remainingSeconds: number;
        sessionId?: undefined;
    } | {
        valid: boolean;
        remainingSeconds: number;
        sessionId: any;
    }>;
    listSessions(req: any): Promise<{
        sessions: {
            id: string;
            createdAt: Date;
            deviceInfo: Record<string, any>;
            lastUsedAt: Date;
        }[];
    }>;
    revokeSession(dto: RevokeSessionDto, req: any): Promise<{
        success: boolean;
    }>;
    register(registerDto: RegisterDto, req: any, res: Response): Promise<{
        success: boolean;
        user: {
            id: string;
            email: string;
            role: string;
        };
        sessionId: string;
        accessToken: string;
        refreshToken: string;
    }>;
    verifyEmail(token: string): Promise<{
        success: boolean;
        user: import("../../users/entities/user.entity").User;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        success: boolean;
        tokenSent: boolean;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        user: import("../../users/entities/user.entity").User;
    }>;
    requestAccountRecovery(dto: RequestAccountRecoveryDto): Promise<{
        recoveryToken?: string | undefined;
        success: boolean;
    }>;
    completeAccountRecovery(dto: CompleteAccountRecoveryDto): Promise<{
        success: boolean;
    }>;
    changePassword(req: any, oldPassword: string, newPassword: string): Promise<{
        message: string;
        success: boolean;
    }>;
    mfaEnroll(req: any): Promise<{
        success: boolean;
        secret: any;
        otpauth_url: any;
    }>;
    mfaVerify(req: any, code: string): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    socialLogin(): Promise<{
        success: boolean;
        message: string;
    }>;
    auditLogs(): Promise<{
        success: boolean;
        message: string;
    }>;
    private setAuthCookies;
    private clearAuthCookies;
    private extractDeviceInfo;
}
