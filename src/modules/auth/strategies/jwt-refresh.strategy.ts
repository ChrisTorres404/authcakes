import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenService } from '../services/token.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UsersService } from '../../users/services/users.service';
import { SessionService } from '../services/session.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.refresh_token || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('auth.jwt.secret'),
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  async validate(request: Request, payload: JwtPayload) {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Not a refresh token');
    }
    const refreshToken = request.cookies.refresh_token;
    const isValid = await this.tokenService.isRefreshTokenValid(refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }
    // Check user exists
    const user = await this.usersService.findById(payload.sub).catch(() => null);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Check session is valid
    const sessionValid = await this.sessionService.isSessionValid(payload.sub, payload.sessionId);
    if (!sessionValid) {
      throw new UnauthorizedException('Session is invalid or expired');
    }
    // Attach session and user context if needed
    request['sessionId'] = payload.sessionId;
    request['userId'] = payload.sub;
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