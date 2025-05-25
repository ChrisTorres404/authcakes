import { User } from '../../users/entities/user.entity';
export declare class MfaRecoveryCode {
    id: string;
    userId: string;
    code: string;
    used: boolean;
    usedAt: Date;
    user: User;
    createdAt: Date;
    updatedAt: Date;
}
