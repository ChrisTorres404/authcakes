export interface ProductionConfig {
    security: {
        enforceHttps: boolean;
        enableSecurityHeaders: boolean;
        enableAuditLogging: boolean;
        enableIntrusionDetection: boolean;
        maxFailedAttempts: number;
        accountLockDuration: number;
    };
    performance: {
        enableCaching: boolean;
        cacheTimeout: number;
        enableCompression: boolean;
        maxRequestSize: string;
        enableRequestLogging: boolean;
    };
    monitoring: {
        enableMetrics: boolean;
        enableHealthChecks: boolean;
        enablePerformanceTracking: boolean;
        alertThresholds: {
            errorRate: number;
            responseTime: number;
            memoryUsage: number;
            cpuUsage: number;
        };
    };
    compliance: {
        enableDataRetention: boolean;
        logRetentionDays: number;
        enableGdprCompliance: boolean;
        enableSoc2Compliance: boolean;
        enableAuditTrail: boolean;
    };
}
declare const _default: (() => ProductionConfig) & import("@nestjs/config").ConfigFactoryKeyHost<ProductionConfig>;
export default _default;
