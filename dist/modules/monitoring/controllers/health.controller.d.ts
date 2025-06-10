import { HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { MetricsService } from '../services/metrics.service';
export declare class HealthController {
    private health;
    private db;
    private memory;
    private disk;
    private metrics;
    constructor(health: HealthCheckService, db: TypeOrmHealthIndicator, memory: MemoryHealthIndicator, disk: DiskHealthIndicator, metrics: MetricsService);
    check(): {
        status: string;
        timestamp: string;
        service: string;
        version: string;
        environment: string;
    };
    live(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    ready(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    metrics(): Promise<{
        timestamp: string;
        uptime: number;
        memory: {
            heapUsed: number;
            heapTotal: number;
            rss: number;
            external: number;
        };
        cpu: NodeJS.CpuUsage;
        pid: number;
        version: {
            node: string;
            service: string;
        };
    }>;
}
