import { User } from '../../users/entities/user.entity';
import { Session } from './session.entity';
export declare class RefreshToken {
    id: string;
    user: User;
    session: Session;
    token: string;
    expiresAt: Date;
    isRevoked: boolean;
    revokedAt: Date;
    revokedBy: string;
    replacedByToken: string;
    revocationReason: string;
    userAgent: string;
    ipAddress: string;
    createdAt: Date;
    updatedAt: Date;
}
