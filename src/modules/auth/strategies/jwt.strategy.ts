//src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/services/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { SessionService } from '../services/session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
  ) {
    console.log('[JWTStrategy] Constructor called');
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          console.log('[JWTStrategy] Custom extractor, request.url:', request?.url, 'headers:', request?.headers);
          const token = request?.cookies?.access_token;
          if (!token) return null;
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('auth.jwt.secret'),
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  async validate(request: Request, payload: JwtPayload) {
    console.log('[JWTStrategy] validate called. Request url:', request.url, 'headers:', request.headers);
    console.log('[JWTStrategy] Request cookies:', request.cookies);
    console.log('[JWTStrategy] Decoded JWT payload:', payload);
    const user = await this.usersService.findById(payload.sub);
    console.log('[JWTStrategy] User lookup result:', user);
    if (!user) {
      console.warn('[JWTStrategy] User not found for sub:', payload.sub);
      throw new UnauthorizedException('User not found');
    }
    // Check if session is valid (not revoked, not expired)
    if (payload.sessionId) {
      console.log('[JWTStrategy] Checking session validity for userId:', user.id, 'sessionId:', payload.sessionId);
      let sessionValid = false;
      let session: any = null;
      if (this.sessionService) {
        session = await this.sessionService.getSessionById(payload.sessionId);
        sessionValid = await this.sessionService.isSessionValid(user.id, payload.sessionId);
      } else {
        const sessionService = (this as any).sessionService || request.app?.get('SessionService');
        if (sessionService) {
          session = await sessionService.getSessionById(payload.sessionId);
          sessionValid = await sessionService.isSessionValid(user.id, payload.sessionId);
        }
      }
      console.log('[JWTStrategy] Session lookup result:', session);
      if (!session) {
        console.warn('[JWTStrategy] Session not found for sessionId:', payload.sessionId);
      } else if (session.revoked) {
        console.warn('[JWTStrategy] Session is revoked:', session);
      } else if (session.expiresAt && session.expiresAt < new Date()) {
        console.warn('[JWTStrategy] Session is expired:', session);
      }
      if (!sessionValid) {
        console.warn('[JWTStrategy] Session is not valid for userId:', user.id, 'sessionId:', payload.sessionId);
        throw new UnauthorizedException('Session is revoked or expired');
      }
    }
    // Attach full tenant context to the request
    request['tenantId'] = payload.tenantId;
    request['tenantAccess'] = payload.tenantAccess;
    request['sessionId'] = payload.sessionId;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: payload.tenantId,
      tenantAccess: payload.tenantAccess,
      sessionId: payload.sessionId,
      type: payload.type,
    };
  }
}
