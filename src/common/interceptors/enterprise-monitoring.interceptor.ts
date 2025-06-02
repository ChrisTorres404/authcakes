import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

interface SecurityEvent {
  type: 'authentication' | 'authorization' | 'data_access' | 'admin_action' | 'security_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip: string;
  userAgent: string;
  endpoint: string;
  method: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
  userAgent: string;
  ip: string;
}

@Injectable()
export class EnterpriseMonitoringInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EnterpriseMonitoringInterceptor.name);
  private readonly metricsEnabled: boolean;
  private readonly auditEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.metricsEnabled = this.configService.get<boolean>('production.monitoring.enableMetrics', true);
    this.auditEnabled = this.configService.get<boolean>('production.security.enableAuditLogging', true);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Add request ID to headers for tracing
    response.setHeader('X-Request-ID', requestId);
    request['requestId'] = requestId;

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        
        if (this.metricsEnabled) {
          this.logPerformanceMetrics({
            endpoint: request.url,
            method: request.method,
            duration,
            statusCode: response.statusCode,
            timestamp: new Date(),
            userAgent: request.headers['user-agent'] || 'unknown',
            ip: this.extractClientIp(request),
          });
        }

        if (this.auditEnabled && this.isSecuritySensitiveEndpoint(request.url)) {
          this.logSecurityEvent({
            type: this.determineSecurityEventType(request),
            severity: 'low',
            userId: request.user?.['sub'],
            ip: this.extractClientIp(request),
            userAgent: request.headers['user-agent'] || 'unknown',
            endpoint: request.url,
            method: request.method,
            timestamp: new Date(),
            details: {
              requestId,
              duration,
              statusCode: response.statusCode,
            },
          });
        }

        // Check for performance thresholds
        this.checkPerformanceThresholds(duration, request.url);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        // Log security violations and errors
        if (this.auditEnabled) {
          this.logSecurityEvent({
            type: 'security_violation',
            severity: this.determineSeverity(error, request),
            userId: request.user?.['sub'],
            ip: this.extractClientIp(request),
            userAgent: request.headers['user-agent'] || 'unknown',
            endpoint: request.url,
            method: request.method,
            timestamp: new Date(),
            details: {
              requestId,
              duration,
              error: error.message,
              errorType: error.constructor.name,
            },
          });
        }

        // Check for potential security attacks
        this.checkSecurityThreats(error, request);

        throw error;
      }),
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private extractClientIp(request: Request): string {
    return (
      request.headers['cf-connecting-ip'] ||
      request.headers['x-real-ip'] ||
      request.headers['x-forwarded-for'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    ) as string;
  }

  private isSecuritySensitiveEndpoint(url: string): boolean {
    const sensitivePatterns = [
      '/auth/',
      '/users/',
      '/admin/',
      '/settings/',
      '/tenants/',
    ];
    return sensitivePatterns.some(pattern => url.includes(pattern));
  }

  private determineSecurityEventType(request: Request): SecurityEvent['type'] {
    if (request.url.includes('/auth/')) return 'authentication';
    if (request.url.includes('/admin/')) return 'admin_action';
    if (request.url.includes('/users/')) return 'data_access';
    if (request.method !== 'GET') return 'data_access';
    return 'authorization';
  }

  private determineSeverity(error: any, request: Request): SecurityEvent['severity'] {
    // Critical: Authentication bypass, privilege escalation
    if (error.status === 403 && request.url.includes('/admin/')) return 'critical';
    if (error.message?.includes('bypass') || error.message?.includes('escalation')) return 'critical';
    
    // High: Authentication failures, data access violations
    if (error.status === 401) return 'high';
    if (error.status === 403) return 'high';
    
    // Medium: Validation errors, rate limiting
    if (error.status === 400) return 'medium';
    if (error.status === 429) return 'medium';
    
    // Low: General errors
    return 'low';
  }

  private logPerformanceMetrics(metrics: PerformanceMetrics): void {
    // Log performance metrics in structured format for monitoring systems
    this.logger.log(
      `PERFORMANCE_METRIC: ${JSON.stringify({
        ...metrics,
        type: 'performance_metric',
      })}`,
    );
  }

  private logSecurityEvent(event: SecurityEvent): void {
    // Log security events in structured format for SIEM systems
    this.logger.log(
      `SECURITY_EVENT: ${JSON.stringify({
        ...event,
        type: 'security_event',
      })}`,
    );

    // Send alerts for high/critical severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      this.sendSecurityAlert(event);
    }
  }

  private checkPerformanceThresholds(duration: number, endpoint: string): void {
    const thresholds = this.configService.get('production.monitoring.alertThresholds');
    
    if (duration > thresholds.responseTime) {
      this.logger.warn(
        `PERFORMANCE_ALERT: Slow response detected - Endpoint: ${endpoint}, Duration: ${duration}ms, Threshold: ${thresholds.responseTime}ms`,
      );
      
      // Send performance alert
      this.sendPerformanceAlert({
        type: 'slow_response',
        endpoint,
        duration,
        threshold: thresholds.responseTime,
        timestamp: new Date(),
      });
    }
  }

  private checkSecurityThreats(error: any, request: Request): void {
    const ip = this.extractClientIp(request);
    
    // Check for potential brute force attacks
    if (error.status === 401 && request.url.includes('/auth/login')) {
      this.detectBruteForceAttack(ip, request.url);
    }
    
    // Check for SQL injection attempts
    if (this.isSqlInjectionAttempt(request)) {
      this.logSecurityEvent({
        type: 'security_violation',
        severity: 'critical',
        ip,
        userAgent: request.headers['user-agent'] || 'unknown',
        endpoint: request.url,
        method: request.method,
        timestamp: new Date(),
        details: {
          suspiciousActivity: 'sql_injection_attempt',
          payload: request.body,
        },
      });
    }
  }

  private detectBruteForceAttack(ip: string, endpoint: string): void {
    // Implementation would use Redis or in-memory cache to track failed attempts
    this.logger.warn(
      `SECURITY_ALERT: Potential brute force attack detected - IP: ${ip}, Endpoint: ${endpoint}`,
    );
  }

  private isSqlInjectionAttempt(request: Request): boolean {
    const payload = JSON.stringify(request.body || '') + JSON.stringify(request.query || '');
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
      /(INFORMATION_SCHEMA|SYS\.TABLES|DUAL)/i,
      /(\;\s*(DROP|DELETE|UPDATE|INSERT))/i,
    ];
    
    return sqlPatterns.some(pattern => pattern.test(payload));
  }

  private sendSecurityAlert(event: SecurityEvent): void {
    // Implementation would send alerts to security team
    // This could integrate with:
    // - Email alerts
    // - Slack/Teams notifications
    // - PagerDuty for critical events
    // - SIEM systems (Splunk, ELK, etc.)
    
    this.logger.error(
      `SECURITY_ALERT_SENT: ${JSON.stringify({
        ...event,
        alertType: 'security_incident',
        escalation: event.severity === 'critical' ? 'immediate' : 'standard',
      })}`,
    );
  }

  private sendPerformanceAlert(alert: any): void {
    // Implementation would send performance alerts to operations team
    this.logger.warn(
      `PERFORMANCE_ALERT_SENT: ${JSON.stringify({
        ...alert,
        alertType: 'performance_degradation',
      })}`,
    );
  }
}