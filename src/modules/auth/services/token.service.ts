import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Session } from '../entities/session.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { DeviceInfo, AuthTokenResponse } from '../interfaces/auth.interfaces';
import { UsersService } from '../../users/services/users.service';
import { TenantsService } from '../../tenants/services/tenants.service';
import { SessionService } from './session.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly sessionService: SessionService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * Generate access and refresh tokens for a user
   * @param userId - User ID to generate tokens for
   * @param deviceInfo - Device information for session creation
   * @returns Object containing tokens, session ID, and user info
   * @throws Error if user not found
   */
  async generateTokens(
    userId: string,
    deviceInfo: DeviceInfo = {},
    existingUser?: { id: string; email: string; role: string; firstName: string; lastName: string; avatar?: string; emailVerified: boolean }, // Enterprise: avoid race condition
  ): Promise<AuthTokenResponse> {
    // Use existing user if provided (enterprise: avoids race condition)
    // Otherwise fetch from database (standard operation)
    const user = existingUser || await this.usersService.findById(userId);
    if (!user) throw new Error('User not found');

    // Get tenant memberships
    const tenantMemberships =
      await this.tenantsService.getUserTenantMemberships(userId);
    const defaultTenantId =
      tenantMemberships.length > 0 ? tenantMemberships[0].tenantId : null;

    // Get tenant access list
    const tenantAccess = tenantMemberships.map((tm) => tm.tenantId);

    // Create session and use its actual ID
    const session = await this.sessionService.createSession({
      userId,
      deviceInfo,
    });
    // Security: Removed console.log that exposed session ID

    // Create JWT payload
    const payload: JwtPayload = {
      sub: userId,
      email: user.email,
      role: user.role,
      tenantId: defaultTenantId,
      tenantAccess,
      sessionId: session.id,
      type: 'access',
    };

    // Generate tokens
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken({
      ...payload,
      type: 'refresh',
    });

    return {
      success: true,
      accessToken,
      refreshToken,
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * Generate an access token with the given payload
   * @param payload - JWT payload to include in the token
   * @returns Signed access token
   * @throws Error if token expiry configuration is invalid
   */
  generateAccessToken(payload: JwtPayload): string {
    let expiresIn = this.configService.get('auth.jwt.accessExpiresIn');
    expiresIn = parseInt(expiresIn, 10);
    if (!Number.isInteger(expiresIn) || expiresIn <= 0) {
      throw new Error('Invalid access token expiry configuration');
    }
    const token = this.jwtService.sign(payload, { expiresIn });
    // Security: Removed console.log that exposed token timing information
    return token;
  }

  async generateRefreshToken(payload: JwtPayload): Promise<string> {
    let expiresIn = this.configService.get('auth.jwt.refreshExpiresIn');
    expiresIn = parseInt(expiresIn, 10);
    if (!Number.isInteger(expiresIn) || expiresIn <= 0) {
      throw new Error('Invalid refresh token expiry configuration');
    }
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
    const token = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn },
    );
    // Security: Removed console.log that exposed refresh token information
    // Continuing with token generation logic
    // Security: Removed debug info and console.log that exposed session ID
    // Store refresh token
    await this.refreshTokenRepository.save({
      user: { id: payload.sub },
      session: { id: payload.sessionId },
      token: token,
      expiresAt,
    });
    return token;
  }

  /**
   * Verifies a JWT token and returns its payload
   * @param token - JWT token to verify
   * @returns Decoded JWT payload
   * @throws Error if token is invalid or expired
   */
  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }

  async isRefreshTokenValid(token: string): Promise<boolean> {
    try {
      console.log(
        '[TokenService] isRefreshTokenValid called with token:',
        token,
      );
      // Verify JWT is valid
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (!payload || typeof payload !== 'object' || !('type' in payload)) {
        // Security: Removed console.warn that exposed token validation flow
        return false;
      }
      // Security: Removed console.log that exposed token payload
      // Check if token exists and is not revoked
      const tokenRecord = await this.refreshTokenRepository.findOne({
        where: {
          token: token,
          isRevoked: false,
        },
      });
      // Security: Removed console.log that exposed token database record
      if (!tokenRecord) {
        // Security: Removed console.warn that exposed token status
        return false;
      }
      // Check if token is expired
      if (tokenRecord.expiresAt < new Date()) {
        // Security: Removed console.warn that exposed token expiry details
        await this.revokeRefreshToken(token);
        return false;
      }
      // Security: Removed console.log that exposed token validation result
      return true;
    } catch (error) {
      console.warn('[TokenService] Error validating refresh token:', error);
      return false;
    }
  }

  async revokeRefreshToken(
    token: string,
    revokedBy?: string,
    revocationReason?: string,
  ): Promise<void> {
    await this.refreshTokenRepository.update(
      { token: token },
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy: revokedBy ?? undefined,
        revocationReason: revocationReason ?? undefined,
      },
    );
  }

  async revokeSession(
    sessionId: string,
    revokedBy?: string,
    revocationReason?: string,
  ): Promise<void> {
    // Revoke session
    await this.sessionService.revokeSession({ sessionId });

    // Revoke all refresh tokens for this session
    await this.refreshTokenRepository.update(
      { session: { id: sessionId } },
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy: revokedBy ?? undefined,
        revocationReason: revocationReason ?? undefined,
      },
    );
  }

  async listActiveSessions(userId: string): Promise<Session[]> {
    return this.sessionService.getActiveSessions(userId);
  }

  async rotateRefreshToken(
    oldToken: string,
    userId: string,
    sessionId: string,
  ): Promise<string> {
    // Revoke old token
    await this.revokeRefreshToken(oldToken);

    // Get user with tenant info
    const user = await this.usersService.findById(userId);

    // Get tenant memberships
    const tenantMemberships =
      await this.tenantsService.getUserTenantMemberships(userId);
    const defaultTenantId =
      tenantMemberships.length > 0 ? tenantMemberships[0].tenantId : null;

    // Get tenant access list
    const tenantAccess = tenantMemberships.map((tm) => tm.tenantId);

    // Create JWT payload
    const payload: JwtPayload = {
      sub: userId,
      email: user.email,
      role: user.role,
      tenantId: defaultTenantId,
      tenantAccess,
      sessionId,
      type: 'refresh',
    };

    // Generate new refresh token
    return this.generateRefreshToken(payload);
  }

  /**
   * Validate a JWT (access or refresh) and ensure it matches the expected type and is not expired/revoked.
   * Throws on error, returns payload if valid.
   */
  async validateToken(
    token: string,
    type: 'access' | 'refresh',
  ): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid token payload');
      }
      if (!('type' in payload) || !('sub' in payload)) {
        throw new Error('Invalid token structure');
      }
      if (payload.type !== type) {
        throw new Error(`Token is not a ${type} token`);
      }
      if (type === 'refresh') {
        // Check DB for revocation/expiry
        const tokenRecord = await this.refreshTokenRepository.findOne({
          where: { token: token, isRevoked: false },
        });
        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
          throw new Error('Refresh token is revoked or expired');
        }
      }
      return payload;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid or expired token';
      throw new Error(message);
    }
  }

  /**
   * Revoke all refresh tokens for a user (e.g., on password change or account compromise)
   */
  async revokeAllUserTokens(userId: string, reason?: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { user: { id: userId } },
      {
        isRevoked: true,
        revokedAt: new Date(),
        revocationReason: reason || 'user_revocation',
      },
    );
  }

  /**
   * Safely decode a JWT and return its payload, or null if invalid.
   */
  getTokenPayload(token: string): JwtPayload | null {
    try {
      const decoded = this.jwtService.decode(token);
      if (decoded && typeof decoded === 'object' && 'sub' in decoded) {
        return decoded as JwtPayload;
      }
      return null;
    } catch {
      return null;
    }
  }
}
