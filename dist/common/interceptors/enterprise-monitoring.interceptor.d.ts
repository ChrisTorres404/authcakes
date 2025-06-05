import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
export declare class EnterpriseMonitoringInterceptor implements NestInterceptor {
    private readonly configService;
    private readonly logger;
    private readonly metricsEnabled;
    private readonly auditEnabled;
    constructor(configService: ConfigService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private generateRequestId;
    private extractClientIp;
    private isSecuritySensitiveEndpoint;
    private determineSecurityEventType;
    private determineSeverity;
    private logPerformanceMetrics;
    private logSecurityEvent;
    private checkPerformanceThresholds;
    private checkSecurityThreats;
    private detectBruteForceAttack;
    private isSqlInjectionAttempt;
    private sendSecurityAlert;
    private sendPerformanceAlert;
}
