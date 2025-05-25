import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Session } from '../entities/session.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
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

  async generateTokens(userId: string, deviceInfo: any = {}) {
    // Get user with tenant info
    const user = await this.usersService.findById(userId);
    if (!user) throw new Error('User not found');

    // Get tenant memberships
    const tenantMemberships = await this.tenantsService.getUserTenantMemberships(userId);
    const defaultTenantId = tenantMemberships.length > 0 ? tenantMemberships[0].tenantId : null;

    // Get tenant access list
    const tenantAccess = tenantMemberships.map(tm => tm.tenantId);

    // Create session and use its actual ID
    const session = await this.sessionService.createSession({ userId, deviceInfo });
    console.log('[TokenService] Created session with ID:', session.id);

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
      type: 'refresh'
    });

    return {
      accessToken,
      refreshToken,
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  generateAccessToken(payload: JwtPayload): string {
    let expiresIn = this.configService.get('auth.jwt.accessExpiresIn');
    expiresIn = parseInt(expiresIn, 10);
    if (!Number.isInteger(expiresIn) || expiresIn <= 0) {
      throw new Error('Invalid access token expiry configuration');
    }
    const token = this.jwtService.sign(payload, { expiresIn });
    const decoded = this.jwtService.decode(token);
    console.log('[TokenService] Access token generated:', {
      expiresIn,
      iat: decoded?.iat,
      exp: decoded?.exp,
      now: Math.floor(Date.now() / 1000),
    });
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
    const token = this.jwtService.sign({ ...payload, type: 'refresh' }, { expiresIn });
    const decoded = this.jwtService.decode(token);
    console.log('[TokenService] Refresh token generated:', {
      expiresIn,
      iat: decoded?.iat,
      exp: decoded?.exp,
      now: Math.floor(Date.now() / 1000),
    });
    // Log sessionId before saving
    console.log('[TokenService] Saving refresh token for sessionId:', payload.sessionId);
    // Store refresh token
    await this.refreshTokenRepository.save({
      user: { id: payload.sub },
      session: { id: payload.sessionId },
      token: token,
      expiresAt,
    });
    return token;
  }

  verifyToken(token: string): any {
    return this.jwtService.verify(token);
  }

  async isRefreshTokenValid(token: string): Promise<boolean> {
    try {
      console.log('[TokenService] isRefreshTokenValid called with token:', token);
      // Verify JWT is valid
      const payload = this.jwtService.verify(token);
      console.log('[TokenService] Decoded refresh token payload:', payload);
      // Check if token exists and is not revoked
      const tokenRecord = await this.refreshTokenRepository.findOne({
        where: {
          token: token,
          isRevoked: false
        }
      });
      console.log('[TokenService] Refresh token DB lookup result:', tokenRecord);
      if (!tokenRecord) {
        console.warn('[TokenService] Refresh token not found or revoked in DB');
        return false;
      }
      // Check if token is expired
      if (tokenRecord.expiresAt < new Date()) {
        console.warn('[TokenService] Refresh token is expired:', tokenRecord);
        await this.revokeRefreshToken(token);
        return false;
      }
      console.log('[TokenService] Refresh token is valid');
      return true;
    } catch (error) {
      console.warn('[TokenService] Error validating refresh token:', error);
      return false;
    }
  }

  async revokeRefreshToken(token: string, revokedBy?: string, revocationReason?: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { token: token },
      { 
        isRevoked: true, 
        revokedAt: new Date(),
        revokedBy: revokedBy ?? undefined,
        revocationReason: revocationReason ?? undefined,
      }
    );
  }

  async revokeSession(sessionId: string, revokedBy?: string, revocationReason?: string): Promise<void> {
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
      }
    );
  }

  async listActiveSessions(userId: string): Promise<Session[]> {
    return this.sessionService.getActiveSessions(userId);
  }
  
  async rotateRefreshToken(oldToken: string, userId: string, sessionId: string): Promise<string> {
    // Revoke old token
    await this.revokeRefreshToken(oldToken);
    
    // Get user with tenant info
    const user = await this.usersService.findById(userId);
    
    // Get tenant memberships
    const tenantMemberships = await this.tenantsService.getUserTenantMemberships(userId);
    const defaultTenantId = tenantMemberships.length > 0 ? tenantMemberships[0].tenantId : null;
    
    // Get tenant access list
    const tenantAccess = tenantMemberships.map(tm => tm.tenantId);
    
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
  async validateToken(token: string, type: 'access' | 'refresh'): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;
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
    } catch (err) {
      throw new Error('Invalid or expired token');
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
      return this.jwtService.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}