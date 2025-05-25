import { Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenService } from '../services/token.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UsersService } from '../../users/services/users.service';
import { SessionService } from '../services/session.service';
declare const JwtRefreshStrategy_base: new (...args: [opt: StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    private readonly configService;
    private readonly tokenService;
    private readonly usersService;
    private readonly sessionService;
    constructor(configService: ConfigService, tokenService: TokenService, usersService: UsersService, sessionService: SessionService);
    validate(request: Request, payload: JwtPayload): Promise<{
        id: string;
        email: string;
        role: string;
        tenantId: string | null;
        tenantAccess: string[];
        sessionId: string;
        type: "refresh";
    }>;
}
export {};
