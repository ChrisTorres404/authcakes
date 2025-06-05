"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EnterpriseMonitoringInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseMonitoringInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const config_1 = require("@nestjs/config");
let EnterpriseMonitoringInterceptor = EnterpriseMonitoringInterceptor_1 = class EnterpriseMonitoringInterceptor {
    configService;
    logger = new common_1.Logger(EnterpriseMonitoringInterceptor_1.name);
    metricsEnabled;
    auditEnabled;
    constructor(configService) {
        this.configService = configService;
        this.metricsEnabled = this.configService.get('production.monitoring.enableMetrics', true);
        this.auditEnabled = this.configService.get('production.security.enableAuditLogging', true);
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        response.setHeader('X-Request-ID', requestId);
        request['requestId'] = requestId;
        return next.handle().pipe((0, operators_1.tap)((data) => {
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
            this.checkPerformanceThresholds(duration, request.url);
        }), (0, operators_1.catchError)((error) => {
            const duration = Date.now() - startTime;
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
            this.checkSecurityThreats(error, request);
            throw error;
        }));
    }
    generateRequestId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
    extractClientIp(request) {
        return (request.headers['cf-connecting-ip'] ||
            request.headers['x-real-ip'] ||
            request.headers['x-forwarded-for'] ||
            request.connection?.remoteAddress ||
            request.socket?.remoteAddress ||
            'unknown');
    }
    isSecuritySensitiveEndpoint(url) {
        const sensitivePatterns = [
            '/auth/',
            '/users/',
            '/admin/',
            '/settings/',
            '/tenants/',
        ];
        return sensitivePatterns.some(pattern => url.includes(pattern));
    }
    determineSecurityEventType(request) {
        if (request.url.includes('/auth/'))
            return 'authentication';
        if (request.url.includes('/admin/'))
            return 'admin_action';
        if (request.url.includes('/users/'))
            return 'data_access';
        if (request.method !== 'GET')
            return 'data_access';
        return 'authorization';
    }
    determineSeverity(error, request) {
        if (error.status === 403 && request.url.includes('/admin/'))
            return 'critical';
        if (error.message?.includes('bypass') || error.message?.includes('escalation'))
            return 'critical';
        if (error.status === 401)
            return 'high';
        if (error.status === 403)
            return 'high';
        if (error.status === 400)
            return 'medium';
        if (error.status === 429)
            return 'medium';
        return 'low';
    }
    logPerformanceMetrics(metrics) {
        this.logger.log(`PERFORMANCE_METRIC: ${JSON.stringify({
            ...metrics,
            type: 'performance_metric',
        })}`);
    }
    logSecurityEvent(event) {
        this.logger.log(`SECURITY_EVENT: ${JSON.stringify({
            ...event,
            type: 'security_event',
        })}`);
        if (event.severity === 'high' || event.severity === 'critical') {
            this.sendSecurityAlert(event);
        }
    }
    checkPerformanceThresholds(duration, endpoint) {
        const thresholds = this.configService.get('production.monitoring.alertThresholds');
        if (duration > thresholds.responseTime) {
            this.logger.warn(`PERFORMANCE_ALERT: Slow response detected - Endpoint: ${endpoint}, Duration: ${duration}ms, Threshold: ${thresholds.responseTime}ms`);
            this.sendPerformanceAlert({
                type: 'slow_response',
                endpoint,
                duration,
                threshold: thresholds.responseTime,
                timestamp: new Date(),
            });
        }
    }
    checkSecurityThreats(error, request) {
        const ip = this.extractClientIp(request);
        if (error.status === 401 && request.url.includes('/auth/login')) {
            this.detectBruteForceAttack(ip, request.url);
        }
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
    detectBruteForceAttack(ip, endpoint) {
        this.logger.warn(`SECURITY_ALERT: Potential brute force attack detected - IP: ${ip}, Endpoint: ${endpoint}`);
    }
    isSqlInjectionAttempt(request) {
        const payload = JSON.stringify(request.body || '') + JSON.stringify(request.query || '');
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
            /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
            /(INFORMATION_SCHEMA|SYS\.TABLES|DUAL)/i,
            /(\;\s*(DROP|DELETE|UPDATE|INSERT))/i,
        ];
        return sqlPatterns.some(pattern => pattern.test(payload));
    }
    sendSecurityAlert(event) {
        this.logger.error(`SECURITY_ALERT_SENT: ${JSON.stringify({
            ...event,
            alertType: 'security_incident',
            escalation: event.severity === 'critical' ? 'immediate' : 'standard',
        })}`);
    }
    sendPerformanceAlert(alert) {
        this.logger.warn(`PERFORMANCE_ALERT_SENT: ${JSON.stringify({
            ...alert,
            alertType: 'performance_degradation',
        })}`);
    }
};
exports.EnterpriseMonitoringInterceptor = EnterpriseMonitoringInterceptor;
exports.EnterpriseMonitoringInterceptor = EnterpriseMonitoringInterceptor = EnterpriseMonitoringInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EnterpriseMonitoringInterceptor);
//# sourceMappingURL=enterprise-monitoring.interceptor.js.map