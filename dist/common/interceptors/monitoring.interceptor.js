"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const monitoring_config_1 = require("../../config/monitoring.config");
let MonitoringInterceptor = class MonitoringInterceptor {
    logger = new common_1.Logger('MonitoringInterceptor');
    tracer = (0, monitoring_config_1.getTracer)();
    intercept(context, next) {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const { method, url, headers, params, query, body } = request;
        const userAgent = headers['user-agent'] || 'unknown';
        const ip = request.ip || headers['x-forwarded-for'] || 'unknown';
        const span = this.tracer.startSpan(`${method} ${url}`, {
            tags: {
                'http.method': method,
                'http.url': url,
                'http.user_agent': userAgent,
                'http.remote_addr': ip,
                'resource.name': `${method} ${request.route?.path || url}`,
            },
        });
        span.setTag('http.request.params', JSON.stringify(params));
        span.setTag('http.request.query', JSON.stringify(query));
        const sanitizedBody = this.sanitizeBody(body);
        if (sanitizedBody) {
            span.setTag('http.request.body', JSON.stringify(sanitizedBody));
        }
        const startTime = Date.now();
        return next.handle().pipe((0, operators_1.tap)({
            next: (data) => {
                const duration = Date.now() - startTime;
                const statusCode = response.statusCode;
                span.setTag('http.status_code', statusCode);
                span.setTag('http.response.duration_ms', duration);
                if (duration > 1000) {
                    this.logger.warn(`Slow request detected: ${method} ${url} took ${duration}ms`);
                    span.setTag('performance.slow_request', true);
                }
                if (url.includes('/auth/login') && statusCode === 201) {
                    span.setTag('business.login.success', true);
                }
                else if (url.includes('/auth/register') && statusCode === 201) {
                    span.setTag('business.registration.success', true);
                }
                span.finish();
            },
            error: (error) => {
                const duration = Date.now() - startTime;
                span.setTag('error', true);
                span.setTag('error.type', error.name);
                span.setTag('error.message', error.message);
                span.setTag('error.stack', error.stack);
                span.setTag('http.status_code', error.status || 500);
                span.setTag('http.response.duration_ms', duration);
                this.logger.error(`Request failed: ${method} ${url} - ${error.message}`, error.stack);
                span.finish();
            },
        }));
    }
    sanitizeBody(body) {
        if (!body || typeof body !== 'object') {
            return body;
        }
        const sensitiveFields = [
            'password',
            'currentPassword',
            'newPassword',
            'token',
            'refreshToken',
            'accessToken',
            'apiKey',
            'secret',
            'creditCard',
            'ssn',
            'recoveryAnswer',
        ];
        const sanitized = { ...body };
        for (const field of sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = '[REDACTED]';
            }
        }
        return sanitized;
    }
};
exports.MonitoringInterceptor = MonitoringInterceptor;
exports.MonitoringInterceptor = MonitoringInterceptor = __decorate([
    (0, common_1.Injectable)()
], MonitoringInterceptor);
//# sourceMappingURL=monitoring.interceptor.js.map