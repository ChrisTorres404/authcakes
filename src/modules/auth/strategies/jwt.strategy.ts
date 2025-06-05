//src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { UsersService } from '../../users/services/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { SessionService } from '../services/session.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          // Extract JWT from cookies for browser-based applications
          const token = request?.cookies?.access_token || null;
          if (process.env.NODE_ENV === 'test') {
            console.log('JWT Cookie extraction - cookies:', request?.cookies);
            console.log('JWT Cookie extraction - token:', token ? 'found' : 'not found');
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('auth.jwt.secret'),
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  async validate(request: Request, payload: JwtPayload): Promise<JwtPayload> {
    const startTime = Date.now();
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    try {
      // Security logging - log all JWT validation attempts
      this.logger.log(`JWT validation started - RequestID: ${requestId}, User: ${payload.sub}, URL: ${request.url}`);
      
      const user: User = await this.usersService.findById(payload.sub);
      if (!user) {
        this.logger.warn(`JWT validation failed - User not found - RequestID: ${requestId}, UserID: ${payload.sub}`);
        throw new UnauthorizedException('User not found');
      }
      
      // Check if user account is active and not locked
      if (!user.active) {
        this.logger.warn(`JWT validation failed - Inactive user - RequestID: ${requestId}, UserID: ${payload.sub}`);
        throw new UnauthorizedException('Account is inactive');
      }
      
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        this.logger.warn(`JWT validation failed - Account locked - RequestID: ${requestId}, UserID: ${payload.sub}, LockedUntil: ${user.lockedUntil}`);
        throw new UnauthorizedException('Account is temporarily locked');
      }
      
      // Check if session is valid (not revoked, not expired)
      if (payload.sessionId) {
        const session = await this.sessionService?.getSessionById(payload.sessionId);
        const sessionValid = await this.sessionService?.isSessionValid(user.id, payload.sessionId) ?? false;
        
        if (!session) {
          this.logger.warn(`JWT validation failed - Session not found - RequestID: ${requestId}, UserID: ${payload.sub}, SessionID: ${payload.sessionId}`);
          throw new UnauthorizedException('Session not found');
        }
        
        if (session.revoked) {
          this.logger.warn(`JWT validation failed - Session revoked - RequestID: ${requestId}, UserID: ${payload.sub}, SessionID: ${payload.sessionId}`);
          throw new UnauthorizedException('Session has been revoked');
        }
        
        if (session.expiresAt && session.expiresAt < new Date()) {
          this.logger.warn(`JWT validation failed - Session expired - RequestID: ${requestId}, UserID: ${payload.sub}, SessionID: ${payload.sessionId}, ExpiredAt: ${session.expiresAt}`);
          throw new UnauthorizedException('Session has expired');
        }
        
        if (!sessionValid) {
          this.logger.warn(`JWT validation failed - Invalid session - RequestID: ${requestId}, UserID: ${payload.sub}, SessionID: ${payload.sessionId}`);
          throw new UnauthorizedException('Session is invalid');
        }
      }
      
      // Attach full tenant context to the request
      const typedRequest = request as RequestWithUser;
      typedRequest.tenantId = payload.tenantId ?? undefined;
      typedRequest.tenantAccess = payload.tenantAccess;
      typedRequest.sessionId = payload.sessionId;

      const duration = Date.now() - startTime;
      this.logger.log(`JWT validation successful - RequestID: ${requestId}, UserID: ${payload.sub}, Duration: ${duration}ms`);
      
      // Return enhanced payload with tenant access for TenantAuthGuard
      return {
        ...payload,
        tenantAccess: payload.tenantAccess || [],
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`JWT validation error - RequestID: ${requestId}, Duration: ${duration}ms, Error: ${error.message}`);
      throw error;
    }
  }
}
