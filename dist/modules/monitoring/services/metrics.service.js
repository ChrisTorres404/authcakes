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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const monitoring_config_1 = require("../../../config/monitoring.config");
const node_statsd_1 = require("node-statsd");
let MetricsService = class MetricsService {
    logger = new common_1.Logger('MetricsService');
    tracer = (0, monitoring_config_1.getTracer)();
    statsd;
    constructor() {
        this.initializeStatsD();
    }
    initializeStatsD() {
        try {
            this.statsd = new node_statsd_1.default({
                host: process.env.DD_AGENT_HOST || 'localhost',
                port: parseInt(process.env.DD_DOGSTATSD_PORT || '8125'),
                prefix: 'authcakes.',
                global_tags: [
                    `env:${process.env.NODE_ENV || 'development'}`,
                    `service:${process.env.DD_SERVICE || 'authcakes-api'}`,
                    `version:${process.env.DD_VERSION || '1.0.0'}`,
                ],
            });
            this.logger.log('StatsD client initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize StatsD client', error);
        }
    }
    recordLogin(success, method = 'local', tags) {
        const metric = success ? 'auth.login.success' : 'auth.login.failure';
        this.increment(metric, { method, ...tags });
        if (!success) {
            this.tracer.increment('auth.login.failure', { method });
        }
    }
    recordRegistration(success, tags) {
        const metric = success ? 'auth.registration.success' : 'auth.registration.failure';
        this.increment(metric, tags);
    }
    recordPasswordChange(success, tags) {
        const metric = success ? 'auth.password_change.success' : 'auth.password_change.failure';
        this.increment(metric, tags);
    }
    recordAccountRecovery(stage, tags) {
        this.increment(`auth.account_recovery.${stage}`, tags);
    }
    recordMfaEvent(event, method, tags) {
        this.increment(`auth.mfa.${event}`, { method, ...tags });
    }
    recordSessionCreated(tags) {
        this.increment('session.created', tags);
        this.gauge('session.active', 1, tags);
    }
    recordSessionRevoked(reason, tags) {
        this.increment('session.revoked', { reason, ...tags });
        this.gauge('session.active', -1, tags);
    }
    recordTokenRefresh(success, tags) {
        const metric = success ? 'token.refresh.success' : 'token.refresh.failure';
        this.increment(metric, tags);
    }
    recordTenantCreated(tags) {
        this.increment('tenant.created', tags);
    }
    recordTenantMemberAdded(role, tags) {
        this.increment('tenant.member.added', { role, ...tags });
    }
    recordTenantInvitation(event, tags) {
        this.increment(`tenant.invitation.${event}`, tags);
    }
    recordSecurityEvent(event, severity, tags) {
        this.increment(`security.event.${event}`, { severity, ...tags });
        if (severity === 'high' || severity === 'critical') {
            this.logger.warn(`High severity security event: ${event}`, tags);
        }
    }
    recordBruteForceAttempt(endpoint, tags) {
        this.increment('security.brute_force.attempt', { endpoint, ...tags });
    }
    recordRateLimitHit(endpoint, tags) {
        this.increment('security.rate_limit.hit', { endpoint, ...tags });
    }
    recordApiLatency(endpoint, duration, tags) {
        this.histogram('api.latency', duration, { endpoint, ...tags });
        if (duration > 1000) {
            this.increment('api.slow_request', { endpoint, ...tags });
        }
    }
    recordDatabaseQuery(operation, table, duration, tags) {
        this.histogram('database.query.duration', duration, { operation, table, ...tags });
        this.increment('database.query.count', { operation, table, ...tags });
    }
    recordCacheHit(key, hit, tags) {
        const metric = hit ? 'cache.hit' : 'cache.miss';
        this.increment(metric, { key, ...tags });
    }
    recordApiKeyCreated(tags) {
        this.increment('api_key.created', tags);
    }
    recordApiKeyUsed(keyId, tags) {
        this.increment('api_key.used', { keyId, ...tags });
    }
    recordError(error, context, tags) {
        this.increment('error.count', { error, context, ...tags });
    }
    increment(metric, tags) {
        try {
            const tagArray = this.formatTags(tags);
            this.statsd.increment(metric, 1, 1, tagArray);
            this.tracer.increment(metric, tags);
        }
        catch (error) {
            this.logger.error(`Failed to increment metric ${metric}`, error);
        }
    }
    gauge(metric, value, tags) {
        try {
            const tagArray = this.formatTags(tags);
            this.statsd.gauge(metric, value, 1, tagArray);
            this.tracer.gauge(metric, value, tags);
        }
        catch (error) {
            this.logger.error(`Failed to record gauge ${metric}`, error);
        }
    }
    histogram(metric, value, tags) {
        try {
            const tagArray = this.formatTags(tags);
            this.statsd.histogram(metric, value, 1, tagArray);
            this.tracer.histogram(metric, value, tags);
        }
        catch (error) {
            this.logger.error(`Failed to record histogram ${metric}`, error);
        }
    }
    timing(metric, duration, tags) {
        try {
            const tagArray = this.formatTags(tags);
            this.statsd.timing(metric, duration, 1, tagArray);
        }
        catch (error) {
            this.logger.error(`Failed to record timing ${metric}`, error);
        }
    }
    formatTags(tags) {
        if (!tags)
            return [];
        return Object.entries(tags)
            .filter(([_, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${key}:${value}`);
    }
    async measureDuration(operation, fn, tags) {
        const startTime = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            this.timing(`operation.${operation}.duration`, duration, { ...tags, status: 'success' });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.timing(`operation.${operation}.duration`, duration, { ...tags, status: 'failure' });
            this.increment(`operation.${operation}.error`, tags);
            throw error;
        }
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map