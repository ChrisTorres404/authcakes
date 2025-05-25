import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
export declare class RefreshTokenRepository extends Repository<RefreshToken> {
    findValidToken(token: string): Promise<RefreshToken | undefined>;
    revokeTokensByUser(userId: string): Promise<void>;
    cleanupExpiredTokens(): Promise<void>;
}
