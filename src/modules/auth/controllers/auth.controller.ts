//src/modules/auth/controllers/auth.controller.ts

import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import * as speakeasy from 'speakeasy';
import {
  DeviceInfo,
  AuthCookieParams,
} from '../interfaces/auth.interfaces';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { SessionService } from '../services/session.service';
import { Public } from '../../../common/decorators/public.decorator';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { RevokeSessionDto } from '../dto/revoke-session.dto';
import { RequestAccountRecoveryDto } from '../dto/request-account-recovery.dto';
import { CompleteAccountRecoveryDto } from '../dto/complete-account-recovery.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import {
  ThrottleLogin,
  ThrottleRegister,
  ThrottlePasswordReset,
  ThrottleRefresh,
} from '../../../common/decorators/throttle.decorator';
import {
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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

@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @ThrottleLogin()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'Successful login returns user info and tokens.',
  })
  async login(
    @Body() _loginDto: LoginDto,
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    // Get device info from request headers
    const deviceInfo = this.extractDeviceInfo(req);

    // Generate tokens
    const { accessToken, refreshToken, sessionId, user } =
      await this.tokenService.generateTokens(req.user.id, deviceInfo);

    // Set cookies
    this.setAuthCookies(res, { accessToken, refreshToken, sessionId });

    // Return user info with proper DTO structure
    return {
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

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout the current user and clear authentication cookies.',
  })
  @ApiOkResponse({
    type: SuccessResponseDto,
    description: 'Logout successful.',
  })
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SuccessResponseDto> {
    if (process.env.NODE_ENV === 'test') {
      console.log('Logout endpoint - cookies:', req.cookies);
      console.log('Logout endpoint - user:', req.user);
    }
    
    // Remove the debugging code since we're using auth headers now
    
    // Get session ID from token payload
    const sessionId = req.user.sessionId;

    if (sessionId) {
      // Revoke session and all associated refresh tokens
      await this.tokenService.revokeSession(
        sessionId,
        req.user.id,
        'User logout',
      );
    }

    // Clear cookies
    this.clearAuthCookies(res);

    return {};
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @ThrottleRefresh()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access and refresh tokens using a valid refresh token.',
  })
  @ApiOkResponse({
    type: TokenResponseDto,
    description: 'Returns new access and refresh tokens, and user info.',
  })
  async refresh(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    const userId = req.user.id;
    const oldSessionId = req.user.sessionId;
    const oldRefreshToken = req.cookies.refresh_token;

    // Get device info
    const deviceInfo = this.extractDeviceInfo(req);

    // Revoke old refresh token
    if (oldRefreshToken) {
      await this.tokenService.revokeRefreshToken(
        oldRefreshToken,
        userId,
        'Refresh token rotation',
      );
    }

    if (!oldSessionId) {
      throw new UnauthorizedException('Invalid session');
    }

    // Generate new tokens with same session ID
    const { accessToken, refreshToken, user } = await this.authService.refresh(
      userId,
      oldSessionId,
      deviceInfo,
    );

    // Set new cookies
    this.setAuthCookies(res, {
      accessToken,
      refreshToken,
      sessionId: oldSessionId,
    });

    // Return user info with proper DTO structure
    return {
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

  @Get('session-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check if the current session is valid and get remaining time.',
  })
  @ApiOkResponse({
    type: SessionStatusResponseDto,
    description: 'Session validity and remaining time.',
  })
  async checkSessionStatus(
    @Req() req: RequestWithUser,
  ): Promise<SessionStatusResponseDto> {
    // Get user and session ID
    const userId = req.user.id ?? '';
    const sessionId = req.user.sessionId ?? '';

    // Check if session is still valid
    const sessionValid = await this.sessionService.isSessionValid(
      userId,
      sessionId,
    );

    if (!sessionValid) {
      return {
        valid: false,
        remainingSeconds: 0,
        sessionId: '', // Include empty sessionId for type safety
      };
    }

    // Get session expiry time
    const remainingSeconds =
      await this.sessionService.getSessionRemainingTime(sessionId);

    return {
      valid: true,
      remainingSeconds,
      sessionId,
    };
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List all active sessions for the current user.' })
  @ApiOkResponse({
    type: SessionListResponseDto,
    description: 'List of active sessions.',
  })
  async listSessions(
    @Req() req: RequestWithUser,
  ): Promise<SessionListResponseDto> {
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

  @Post('revoke-session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a specific session for the current user.' })
  @ApiBody({ type: RevokeSessionDto })
  @ApiOkResponse({
    type: SuccessResponseDto,
    description: 'Session revoked successfully.',
  })
  async revokeSession(
    @Body() dto: RevokeSessionDto,
    @Req() req: RequestWithUser,
  ): Promise<SuccessResponseDto> {
    const userId = req.user.id;

    // Verify user owns this session
    const session = await this.sessionService.getSessionById(dto.sessionId);
    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Session not found or not owned by user');
    }

    // Revoke session
    await this.tokenService.revokeSession(
      dto.sessionId,
      userId,
      'User-initiated session revocation',
    );

    return {};
  }

  @Public()
  @ThrottleRegister()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a new user account.' })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'Registration successful, returns user info and tokens.',
  })
  @ApiBadRequestResponse({ description: 'Invalid input or weak password.' })
  @ApiConflictResponse({ description: 'Email already in use.' })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    // Get device info from request headers
    const deviceInfo = this.extractDeviceInfo(req);

    // Register user and generate tokens
    const { accessToken, refreshToken, sessionId, user, verificationToken } =
      await this.authService.register(registerDto, deviceInfo);

    // Set cookies
    this.setAuthCookies(res, { accessToken, refreshToken, sessionId });

    // Return user info (full user object) and verificationToken for dev only
    return {
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
      verificationToken, // For development use only
    };
  }

  /**
   * Verify email with token
   */
  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify user email with a token.' })
  @ApiBody({ schema: { example: { token: 'verification-token' } } })
  @ApiOkResponse({ 
    type: VerifyEmailResponseDto,
    description: 'Email verified and user info returned.' 
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired verification token.',
  })
  async verifyEmail(@Body('token') token: string): Promise<VerifyEmailResponseDto> {
    const user = await this.authService.verifyEmail(token);
    return { 
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

  /**
   * Request password reset (forgot password)
   */
  @Public()
  @ThrottlePasswordReset()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email.' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({ 
    type: ForgotPasswordResponseDto,
    description: 'Password reset token sent if email exists.' 
  })
  @ApiBadRequestResponse({ description: 'Invalid email or user not found.' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    // This will generate a reset token and (TODO) send email
    const token = await this.authService.requestPasswordReset(dto.email);
    return { tokenSent: !!token };
  }

  /**
   * Reset password with token and OTP (if required)
   */
  @Public()
  @ThrottlePasswordReset()
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset password using a token and optional OTP.' })
  @ApiOkResponse({ 
    type: ResetPasswordResponseDto,
    description: 'Password reset and user info returned.' 
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<ResetPasswordResponseDto> {
    const user = await this.authService.resetPassword(
      dto.token,
      dto.password,
      dto.otp,
    );
    return { 
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

  /**
   * Request account recovery (when user has lost all credentials)
   */
  @Public()
  @ThrottlePasswordReset()
  @Post('request-account-recovery')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request account recovery when all credentials are lost.',
  })
  @ApiBody({ type: RequestAccountRecoveryDto })
  @ApiOkResponse({
    type: RequestAccountRecoveryResponseDto,
    description: 'Account recovery token sent if email exists.',
  })
  @ApiBadRequestResponse({ description: 'Invalid email or user not found.' })
  async requestAccountRecovery(
    @Body() dto: RequestAccountRecoveryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RequestAccountRecoveryResponseDto> {
    // This will generate a recovery token and send notification
    const result = await this.authService.requestAccountRecovery(dto.email);
    
    // Set security headers
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.header('X-Request-ID', req.headers['x-request-id'] || Math.random().toString(36));
    
    return result;
  }

  /**
   * Complete account recovery by setting new password with recovery token
   */
  @Public()
  @ThrottlePasswordReset()
  @Post('complete-account-recovery')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Complete account recovery by setting a new password with a recovery token.',
  })
  @ApiBody({ type: CompleteAccountRecoveryDto })
  @ApiOkResponse({ 
    type: CompleteAccountRecoveryResponseDto,
    description: 'Account recovery completed.' 
  })
  @ApiBadRequestResponse({
    description: 'Invalid token, password, or MFA code.',
  })
  async completeAccountRecovery(
    @Body() dto: CompleteAccountRecoveryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CompleteAccountRecoveryResponseDto> {
    const result = await this.authService.completeAccountRecovery(
      dto.token,
      dto.newPassword,
      dto.mfaCode,
    );
    
    // Set security headers
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.header('X-Request-ID', req.headers['x-request-id'] || Math.random().toString(36));
    
    return result;
  }

  /**
   * Change password (authenticated)
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for the current user.' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({
    type: ChangePasswordResponseDto,
    description: 'Password changed and all sessions/tokens revoked.',
  })
  @ApiBadRequestResponse({ description: 'Invalid input or weak password.' })
  async changePassword(
    @Req() req: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    const userId = req.user.id;
    const result = await this.authService.changePassword(
      userId,
      dto.oldPassword,
      dto.newPassword,
    );
    // Revoke all sessions and tokens for this user
    await this.sessionService.revokeAllUserSessions(userId);
    await this.tokenService.revokeAllUserTokens(userId);
    return { ...result };
  }

  /**
   * MFA enrollment (stub)
   */
  @Post('mfa/enroll')
  @HttpCode(200)
  @ApiOperation({ summary: 'Enroll in multi-factor authentication (MFA).' })
  @ApiOkResponse({
    type: MfaEnrollResponseDto,
    description: 'MFA enrollment secret and URL returned.',
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated.' })
  async mfaEnroll(@Req() req: RequestWithUser): Promise<MfaEnrollResponseDto> {
    // Security: Removed console.log statements that exposed user data
    // Map sub to id for downstream compatibility
    const jwtUser = req.user as any;
    if (jwtUser && jwtUser.sub && !jwtUser.id) {
      jwtUser.id = jwtUser.sub;
    }
    // Enterprise best practice: Validate req.user and req.user.id
    if (!jwtUser || !jwtUser.id) {
      throw new UnauthorizedException('User context missing or invalid in MFA enrollment');
    }
    // Generate a TOTP secret for the user
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `AuthCakes:${req.user.email}`,
      issuer: 'AuthCakes',
    });

    if (!secret.base32) {
      throw new Error('Failed to generate MFA secret');
    }

    // Security: Removed console.log statements that exposed user ID
    await this.authService.setMfaSecret(req.user.id, secret.base32);

    return {
      secret: secret.base32,
      ...(secret.otpauth_url && { otpauth_url: secret.otpauth_url }),
      setupStatus: 'pending',
    };
  }

  @Post('mfa/verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify MFA code to enable MFA.' })
  @ApiBody({ type: MfaVerifyDto })
  @ApiOkResponse({
    type: MfaVerifyResponseDto,
    description: 'MFA enabled if code is valid.',
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated.' })
  async mfaVerify(
    @Req() req: RequestWithUser,
    @Body() verifyDto: MfaVerifyDto,
  ): Promise<MfaVerifyResponseDto> {
    // Get user and secret - req.user is the JWT payload, so use 'sub' field
    const userId = req.user?.id || (req.user as any)?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    
    // Check if using recovery code
    if (verifyDto.type === 'recovery') {
      const isValid = await this.authService.verifyRecoveryCode(userId, verifyDto.code);
      if (isValid) {
        return {};
      }
      throw new UnauthorizedException('Invalid recovery code');
    }
    
    // Regular TOTP verification
    const user = await this.authService.getUserById(userId);
    const secret = user.mfaSecret;
    if (!secret) {
      throw new UnauthorizedException('No MFA secret set');
    }
    
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: verifyDto.code,
      window: 1,
    });
    
    if (verified) {
      // First time enabling MFA - return recovery codes
      if (!user.mfaEnabled) {
        const recoveryCodes = await this.authService.enableMfa(userId);
        return { 
          recoveryCodes,
          message: 'MFA enabled successfully. Save these recovery codes in a safe place.'
        };
      }
      return {};
    } else {
      throw new UnauthorizedException('Invalid MFA code');
    }
  }

  /**
   * Social login (stub)
   */
  @Post('social')
  @ApiOperation({
    summary: 'Social login (not implemented).',
    description: 'This endpoint is a stub and does not perform social login.',
  })
  @ApiOkResponse({
    type: SocialLoginResponseDto,
    description: 'Social login not implemented yet.',
  })
  async socialLogin(): Promise<SocialLoginResponseDto> {
    return { message: 'Social login not implemented yet' };
  }

  /**
   * Audit logs (stub)
   */
  @Get('/audit-logs')
  @ApiOperation({
    summary: 'Get audit logs (not implemented).',
    description: 'This endpoint is a stub and does not return audit logs.',
  })
  @ApiOkResponse({
    type: AuditLogsResponseDto,
    description: 'Audit logs not implemented yet.',
  })
  async auditLogs(): Promise<AuditLogsResponseDto> {
    return { message: 'Audit logs not implemented yet' };
  }

  // Helper methods
  private setAuthCookies(
    res: Response,
    { accessToken, refreshToken, sessionId }: AuthCookieParams,
  ): void {
    const accessTokenTtl = parseInt(
      this.configService.get<string>('auth.jwt.accessExpiresIn') || '900',
      10,
    ); // 15 min
    const refreshTokenTtl = parseInt(
      this.configService.get<string>('auth.jwt.refreshExpiresIn') || '604800',
      10,
    ); // 7 days

    // Set access token cookie (not HttpOnly to allow JS access for header)
    res.cookie('access_token', accessToken, {
      httpOnly: false,
      secure: this.configService.get('app.environment') === 'production',
      sameSite: 'lax',
      maxAge: accessTokenTtl * 1000,
      path: '/',
    });

    // Set refresh token cookie (HttpOnly for security)
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('app.environment') === 'production',
      sameSite: 'strict',
      maxAge: refreshTokenTtl * 1000,
      path: '/api/auth',
    });

    // Set session ID cookie (not HttpOnly to allow JS access)
    res.cookie('session_id', sessionId, {
      httpOnly: false,
      secure: this.configService.get('app.environment') === 'production',
      sameSite: 'lax',
      maxAge: refreshTokenTtl * 1000,
      path: '/',
    });
  }

  private clearAuthCookies(res: Response): void {
    res.cookie('access_token', '', { maxAge: 0, path: '/' });
    res.cookie('refresh_token', '', { maxAge: 0, path: '/api/auth' });
    res.cookie('session_id', '', { maxAge: 0, path: '/' });
  }

  private extractDeviceInfo(req: Request): DeviceInfo {
    return {
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    };
  }
}
