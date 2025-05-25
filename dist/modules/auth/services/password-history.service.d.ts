import { Repository } from 'typeorm';
import { PasswordHistory } from '../entities/password-history.entity';
export declare class PasswordHistoryService {
    private readonly passwordHistoryRepository;
    private readonly logger;
    constructor(passwordHistoryRepository: Repository<PasswordHistory>);
    addToHistory(userId: string, passwordHash: string): Promise<void>;
    isPasswordInHistory(userId: string, newPassword: string, historyCount?: number): Promise<boolean>;
    pruneHistory(userId: string, keepCount: number): Promise<void>;
}
