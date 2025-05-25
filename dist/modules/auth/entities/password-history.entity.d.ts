import { User } from '../../users/entities/user.entity';
export declare class PasswordHistory {
    id: string;
    userId: string;
    user: User;
    passwordHash: string;
    createdAt: Date;
}
