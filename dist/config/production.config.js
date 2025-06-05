"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('production', () => ({
    security: {
        enforceHttps: process.env.NODE_ENV === 'production',
        enableSecurityHeaders: true,
        enableAuditLogging: true,
        enableIntrusionDetection: true,
        maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5'),
        accountLockDuration: parseInt(process.env.ACCOUNT_LOCK_DURATION || '30'),
    },
    performance: {
        enableCaching: process.env.NODE_ENV === 'production',
        cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || '300'),
        enableCompression: true,
        maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
        enableRequestLogging: process.env.NODE_ENV !== 'production',
    },
    monitoring: {
        enableMetrics: process.env.METRICS_ENABLED === 'true',
        enableHealthChecks: true,
        enablePerformanceTracking: true,
        alertThresholds: {
            errorRate: parseFloat(process.env.ALERT_ERROR_RATE || '0.01'),
            responseTime: parseInt(process.env.ALERT_RESPONSE_TIME || '1000'),
            memoryUsage: parseFloat(process.env.ALERT_MEMORY_USAGE || '0.85'),
            cpuUsage: parseFloat(process.env.ALERT_CPU_USAGE || '0.80'),
        },
    },
    compliance: {
        enableDataRetention: true,
        logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '2555'),
        enableGdprCompliance: true,
        enableSoc2Compliance: true,
        enableAuditTrail: true,
    },
}));
//# sourceMappingURL=production.config.js.map