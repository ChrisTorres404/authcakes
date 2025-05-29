import { Repository } from 'typeorm';
import { Request } from 'express';
import { Log } from '../entities/log.entity';
interface LogFilters {
    userId?: string;
    tenantId?: string;
    action?: string;
}
interface LogDetails extends Record<string, unknown> {
    metadata?: Record<string, unknown>;
    error?: string;
    context?: string;
}
export declare class LogsService {
    private logsRepository;
    constructor(logsRepository: Repository<Log>);
    create(logData: Partial<Log>): Promise<Log>;
    findAll(filters?: LogFilters, page?: number, limit?: number): Promise<[Log[], number]>;
    findUserLogs(userId: string, page?: number, limit?: number): Promise<[Log[], number]>;
    findTenantLogs(tenantId: string, page?: number, limit?: number): Promise<[Log[], number]>;
    logAuthEvent(action: string, userId: string | null, details?: LogDetails, request?: Request): Promise<void>;
    logTenantEvent(action: string, userId: string, tenantId: string, details?: LogDetails, request?: Request): Promise<void>;
    logAdminAction(action: string, userId: string, details?: LogDetails, request?: Request): Promise<void>;
}
export {};
