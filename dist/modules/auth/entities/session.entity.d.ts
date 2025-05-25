import { User } from '../../users/entities/user.entity';
import { RefreshToken } from './refresh-token.entity';
export declare class Session {
    id: string;
    userId: string;
    user: User;
    refreshTokens: RefreshToken[];
    ipAddress: string;
    userAgent: string;
    deviceInfo: Record<string, any>;
    expiresAt: Date;
    isActive: boolean;
    revoked: boolean;
    revokedAt: Date;
    lastUsedAt: Date;
    revokedBy: string;
    lastActivityAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
