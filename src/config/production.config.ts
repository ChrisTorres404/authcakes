import { registerAs } from '@nestjs/config';

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

export default registerAs(
  'production',
  (): ProductionConfig => ({
    security: {
      enforceHttps: process.env.NODE_ENV === 'production',
      enableSecurityHeaders: true,
      enableAuditLogging: true,
      enableIntrusionDetection: true,
      maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5'),
      accountLockDuration: parseInt(process.env.ACCOUNT_LOCK_DURATION || '30'), // minutes
    },
    performance: {
      enableCaching: process.env.NODE_ENV === 'production',
      cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || '300'), // 5 minutes
      enableCompression: true,
      maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
      enableRequestLogging: process.env.NODE_ENV !== 'production', // Disable in prod for performance
    },
    monitoring: {
      enableMetrics: process.env.METRICS_ENABLED === 'true',
      enableHealthChecks: true,
      enablePerformanceTracking: true,
      alertThresholds: {
        errorRate: parseFloat(process.env.ALERT_ERROR_RATE || '0.01'), // 1%
        responseTime: parseInt(process.env.ALERT_RESPONSE_TIME || '1000'), // 1 second
        memoryUsage: parseFloat(process.env.ALERT_MEMORY_USAGE || '0.85'), // 85%
        cpuUsage: parseFloat(process.env.ALERT_CPU_USAGE || '0.80'), // 80%
      },
    },
    compliance: {
      enableDataRetention: true,
      logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '2555'), // 7 years
      enableGdprCompliance: true,
      enableSoc2Compliance: true,
      enableAuditTrail: true,
    },
  }),
);