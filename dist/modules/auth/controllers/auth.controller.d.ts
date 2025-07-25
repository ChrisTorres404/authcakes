import { Response, Request } from 'express';
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
import { ChangePasswordDto } from '../dto/change-password.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { SuccessResponseDto } from '../dto/success-response.dto';
import { TokenResponseDto } from '../dto/token-response.dto';
import { SessionStatusResponseDto } from '../dto/session-status-response.dto';
import { SessionListResponseDto } from '../dto/session-list-response.dto';
import { VerifyEmailResponseDto } from '../dto/verify-email-response.dto';
import { ResetPasswordResponseDto } from '../dto/reset-password-response.dto';
import { ForgotPasswordResponseDto } from '../dto/forgot-password-response.dto';
import { RequestAccountRecoveryResponseDto, CompleteAccountRecoveryResponseDto } from '../dto/account-recovery-response.dto';
import { ChangePasswordResponseDto } from '../dto/change-password-response.dto';
import { MfaEnrollResponseDto, MfaVerifyResponseDto } from '../dto/mfa-response.dto';
import { MfaVerifyDto } from '../dto/mfa-verify.dto';
import { SocialLoginResponseDto } from '../dto/social-login-response.dto';
import { AuditLogsResponseDto } from '../dto/audit-logs-response.dto';
export declare class AuthController {
    private readonly authService;
    private readonly tokenService;
    private readonly sessionService;
    private readonly configService;
    constructor(authService: AuthService, tokenService: TokenService, sessionService: SessionService, configService: ConfigService);
    login(_loginDto: LoginDto, req: RequestWithUser, res: Response): Promise<LoginResponseDto>;
    logout(req: RequestWithUser, res: Response): Promise<SuccessResponseDto>;
    refresh(req: RequestWithUser, res: Response): Promise<TokenResponseDto>;
    checkSessionStatus(req: RequestWithUser): Promise<SessionStatusResponseDto>;
    listSessions(req: RequestWithUser): Promise<SessionListResponseDto>;
    revokeSession(dto: RevokeSessionDto, req: RequestWithUser): Promise<SuccessResponseDto>;
    register(registerDto: RegisterDto, req: Request, res: Response): Promise<LoginResponseDto>;
    verifyEmail(token: string): Promise<VerifyEmailResponseDto>;
    forgotPassword(dto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto>;
    resetPassword(dto: ResetPasswordDto): Promise<ResetPasswordResponseDto>;
    requestAccountRecovery(dto: RequestAccountRecoveryDto, req: Request, res: Response): Promise<RequestAccountRecoveryResponseDto>;
    completeAccountRecovery(dto: CompleteAccountRecoveryDto, req: Request, res: Response): Promise<CompleteAccountRecoveryResponseDto>;
    changePassword(req: RequestWithUser, dto: ChangePasswordDto): Promise<ChangePasswordResponseDto>;
    mfaEnroll(req: RequestWithUser): Promise<MfaEnrollResponseDto>;
    mfaVerify(req: RequestWithUser, verifyDto: MfaVerifyDto): Promise<MfaVerifyResponseDto>;
    socialLogin(): Promise<SocialLoginResponseDto>;
    auditLogs(): Promise<AuditLogsResponseDto>;
    private setAuthCookies;
    private clearAuthCookies;
    private extractDeviceInfo;
}
