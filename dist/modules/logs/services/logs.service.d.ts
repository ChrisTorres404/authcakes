import { Repository } from 'typeorm';
import { Log } from 'src/modules/logs/entities/log.entity';
export declare class LogsService {
    private logsRepository;
    constructor(logsRepository: Repository<Log>);
    create(logData: Partial<Log>): Promise<Log>;
    findAll(filters?: Partial<Log>, page?: number, limit?: number): Promise<[Log[], number]>;
    findUserLogs(userId: string, page?: number, limit?: number): Promise<[Log[], number]>;
    findTenantLogs(tenantId: string, page?: number, limit?: number): Promise<[Log[], number]>;
    logAuthEvent(action: string, userId: string | null, details?: any, request?: any): Promise<void>;
    logTenantEvent(action: string, userId: string, tenantId: string, details?: any, request?: any): Promise<void>;
    logAdminAction(action: string, userId: string, details?: any, request?: any): Promise<void>;
}
