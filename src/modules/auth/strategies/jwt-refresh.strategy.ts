import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { TokenService } from '../services/token.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UsersService } from '../../users/services/users.service';
import { SessionService } from '../services/session.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string | null =>
          request?.cookies?.refresh_token || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('auth.jwt.secret'),
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  async validate(request: Request, payload: JwtPayload): Promise<JwtPayload> {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Not a refresh token');
    }
    const refreshToken = (request.cookies?.refresh_token ?? '') as string;
    if (typeof refreshToken !== 'string' || !refreshToken) {
      throw new UnauthorizedException('Refresh token missing or invalid');
    }
    const isValid: boolean =
      await this.tokenService.isRefreshTokenValid(refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }
    // Check user exists
    let user: User | null = null;
    try {
      user = await this.usersService.findById(payload.sub);
    } catch {
      user = null;
    }
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Check session is valid
    const sessionValid: boolean = await this.sessionService.isSessionValid(
      payload.sub,
      payload.sessionId,
    );
    if (!sessionValid) {
      throw new UnauthorizedException('Session is invalid or expired');
    }
    // Attach session and user context if needed
    const typedRequest = request as RequestWithUser;
    typedRequest.sessionId = payload.sessionId;
    typedRequest.userId = payload.sub;

    // Return a properly typed payload
    const result: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: payload.tenantId,
      tenantAccess: payload.tenantAccess,
      sessionId: payload.sessionId,
      type: 'refresh',
    };
    return result;
  }
}
