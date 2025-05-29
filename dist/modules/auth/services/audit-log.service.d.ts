import { Repository } from 'typeorm';
import { Log } from '../../logs/entities/log.entity';
interface AuditLogDetails {
    userId?: string;
    tenantId?: string;
    ip?: string;
    userAgent?: string;
    [key: string]: unknown;
}
interface ProfileChange {
    before: unknown;
    after: unknown;
}
export declare class AuditLogService {
    private readonly logsRepository;
    constructor(logsRepository: Repository<Log>);
    log(event: string, details: AuditLogDetails): Promise<void>;
    logProfileUpdate(userId: string, updatedBy: string, changes: Record<string, ProfileChange>, ip?: string, userAgent?: string): Promise<void>;
}
export {};
