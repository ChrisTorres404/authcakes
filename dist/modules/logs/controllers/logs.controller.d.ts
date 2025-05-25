import { LogsService } from '../services/logs.service';
export declare class LogsController {
    private readonly logsService;
    constructor(logsService: LogsService);
    findMyLogs(req: any, page?: number, limit?: number): Promise<[import("../entities/log.entity").Log[], number]>;
    findTenantLogs(tenantId: string, page?: number, limit?: number): Promise<[import("../entities/log.entity").Log[], number]>;
    findAdminLogs(userId: string, tenantId: string, action: string, page?: number, limit?: number): Promise<[import("../entities/log.entity").Log[], number]>;
    createAdminLog(req: any, logData: any): Promise<void>;
}
