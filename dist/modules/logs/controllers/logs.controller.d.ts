import { Request } from 'express';
import { LogsService } from '../services/logs.service';
import { Log } from '../entities/log.entity';
interface AdminLogData {
    action: string;
    details: Record<string, unknown>;
}
export declare class LogsController {
    private readonly logsService;
    constructor(logsService: LogsService);
    findMyLogs(req: Request & {
        user: {
            id: string;
        };
    }, page?: number, limit?: number): Promise<[Log[], number]>;
    findTenantLogs(tenantId: string, page?: number, limit?: number): Promise<[Log[], number]>;
    findAdminLogs(userId?: string, tenantId?: string, action?: string, page?: number, limit?: number): Promise<[Log[], number]>;
    createAdminLog(req: Request & {
        user: {
            id: string;
        };
    }, logData: AdminLogData): Promise<void>;
}
export {};
