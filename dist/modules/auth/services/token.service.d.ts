import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Session } from '../entities/session.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { DeviceInfo, AuthTokenResponse } from '../interfaces/auth.interfaces';
import { UsersService } from '../../users/services/users.service';
import { TenantsService } from '../../tenants/services/tenants.service';
import { SessionService } from './session.service';
export declare class TokenService {
    private readonly jwtService;
    private readonly configService;
    private readonly usersService;
    private readonly tenantsService;
    private readonly sessionService;
    private readonly refreshTokenRepository;
    constructor(jwtService: JwtService, configService: ConfigService, usersService: UsersService, tenantsService: TenantsService, sessionService: SessionService, refreshTokenRepository: Repository<RefreshToken>);
    generateTokens(userId: string, deviceInfo?: DeviceInfo, existingUser?: {
        id: string;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        emailVerified: boolean;
    }): Promise<AuthTokenResponse>;
    generateAccessToken(payload: JwtPayload): string;
    generateRefreshToken(payload: JwtPayload): Promise<string>;
    verifyToken(token: string): JwtPayload;
    isRefreshTokenValid(token: string): Promise<boolean>;
    revokeRefreshToken(token: string, revokedBy?: string, revocationReason?: string): Promise<void>;
    revokeSession(sessionId: string, revokedBy?: string, revocationReason?: string): Promise<void>;
    listActiveSessions(userId: string): Promise<Session[]>;
    rotateRefreshToken(oldToken: string, userId: string, sessionId: string): Promise<string>;
    validateToken(token: string, type: 'access' | 'refresh'): Promise<JwtPayload>;
    revokeAllUserTokens(userId: string, reason?: string): Promise<void>;
    getTokenPayload(token: string): JwtPayload | null;
}
