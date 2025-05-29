import { Response, Request } from 'express';
import { User } from '../../users/entities/user.entity';
import { AuthTokenResponse } from '../interfaces/auth.interfaces';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
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
import { SuccessResponseDto } from '../dto/success-response.dto';
import { SessionStatusResponseDto } from '../dto/session-status-response.dto';
import { SessionListResponseDto } from '../dto/session-list-response.dto';
export declare class AuthController {
    private readonly authService;
    private readonly tokenService;
    private readonly sessionService;
    private readonly configService;
    constructor(authService: AuthService, tokenService: TokenService, sessionService: SessionService, configService: ConfigService);
    login(loginDto: LoginDto, req: RequestWithUser, res: Response): Promise<AuthTokenResponse>;
    logout(req: RequestWithUser, res: Response): Promise<SuccessResponseDto>;
    refresh(req: RequestWithUser, res: Response): Promise<AuthTokenResponse>;
    checkSessionStatus(req: RequestWithUser): Promise<SessionStatusResponseDto>;
    listSessions(req: RequestWithUser): Promise<SessionListResponseDto>;
    revokeSession(dto: RevokeSessionDto, req: RequestWithUser): Promise<SuccessResponseDto>;
    register(registerDto: RegisterDto, req: Request, res: Response): Promise<AuthTokenResponse>;
    verifyEmail(token: string): Promise<{
        success: boolean;
        user: Partial<User>;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        success: boolean;
        tokenSent: boolean;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        user: Partial<User>;
    }>;
    requestAccountRecovery(dto: RequestAccountRecoveryDto): Promise<{
        success: boolean;
        recoveryToken?: string;
    }>;
    completeAccountRecovery(dto: CompleteAccountRecoveryDto): Promise<{
        success: boolean;
    }>;
    changePassword(req: RequestWithUser, oldPassword: string, newPassword: string): Promise<{
        success: boolean;
        message?: string;
    }>;
    mfaEnroll(req: RequestWithUser): Promise<{
        success: boolean;
        secret: string;
        otpauth_url?: string;
    }>;
    mfaVerify(req: RequestWithUser, code: string): Promise<{
        success: boolean;
        message?: string;
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
