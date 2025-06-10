import { Injectable, Logger } from '@nestjs/common';
import { getTracer } from '../../../config/monitoring.config';
import StatsD from 'node-statsd';

export interface MetricTags {
  [key: string]: string | number;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger('MetricsService');
  private readonly tracer = getTracer();
  private statsd: StatsD;

  constructor() {
    this.initializeStatsD();
  }

  private initializeStatsD() {
    try {
      this.statsd = new StatsD({
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
    } catch (error) {
      this.logger.error('Failed to initialize StatsD client', error);
    }
  }

  // Authentication Metrics
  recordLogin(success: boolean, method: string = 'local', tags?: MetricTags) {
    const metric = success ? 'auth.login.success' : 'auth.login.failure';
    this.increment(metric, { method, ...tags });
    
    if (!success) {
      this.tracer.increment('auth.login.failure', { method });
    }
  }

  recordRegistration(success: boolean, tags?: MetricTags) {
    const metric = success ? 'auth.registration.success' : 'auth.registration.failure';
    this.increment(metric, tags);
  }

  recordPasswordChange(success: boolean, tags?: MetricTags) {
    const metric = success ? 'auth.password_change.success' : 'auth.password_change.failure';
    this.increment(metric, tags);
  }

  recordAccountRecovery(stage: 'requested' | 'completed' | 'failed', tags?: MetricTags) {
    this.increment(`auth.account_recovery.${stage}`, tags);
  }

  recordMfaEvent(event: 'enabled' | 'disabled' | 'verified' | 'failed', method: string, tags?: MetricTags) {
    this.increment(`auth.mfa.${event}`, { method, ...tags });
  }

  // Session Metrics
  recordSessionCreated(tags?: MetricTags) {
    this.increment('session.created', tags);
    this.gauge('session.active', 1, tags);
  }

  recordSessionRevoked(reason: 'logout' | 'expired' | 'security' | 'admin', tags?: MetricTags) {
    this.increment('session.revoked', { reason, ...tags });
    this.gauge('session.active', -1, tags);
  }

  recordTokenRefresh(success: boolean, tags?: MetricTags) {
    const metric = success ? 'token.refresh.success' : 'token.refresh.failure';
    this.increment(metric, tags);
  }

  // Tenant Metrics
  recordTenantCreated(tags?: MetricTags) {
    this.increment('tenant.created', tags);
  }

  recordTenantMemberAdded(role: string, tags?: MetricTags) {
    this.increment('tenant.member.added', { role, ...tags });
  }

  recordTenantInvitation(event: 'sent' | 'accepted' | 'expired' | 'cancelled', tags?: MetricTags) {
    this.increment(`tenant.invitation.${event}`, tags);
  }

  // Security Metrics
  recordSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', tags?: MetricTags) {
    this.increment(`security.event.${event}`, { severity, ...tags });
    
    if (severity === 'high' || severity === 'critical') {
      this.logger.warn(`High severity security event: ${event}`, tags);
    }
  }

  recordBruteForceAttempt(endpoint: string, tags?: MetricTags) {
    this.increment('security.brute_force.attempt', { endpoint, ...tags });
  }

  recordRateLimitHit(endpoint: string, tags?: MetricTags) {
    this.increment('security.rate_limit.hit', { endpoint, ...tags });
  }

  // Performance Metrics
  recordApiLatency(endpoint: string, duration: number, tags?: MetricTags) {
    this.histogram('api.latency', duration, { endpoint, ...tags });
    
    if (duration > 1000) {
      this.increment('api.slow_request', { endpoint, ...tags });
    }
  }

  recordDatabaseQuery(operation: string, table: string, duration: number, tags?: MetricTags) {
    this.histogram('database.query.duration', duration, { operation, table, ...tags });
    this.increment('database.query.count', { operation, table, ...tags });
  }

  recordCacheHit(key: string, hit: boolean, tags?: MetricTags) {
    const metric = hit ? 'cache.hit' : 'cache.miss';
    this.increment(metric, { key, ...tags });
  }

  // Business Metrics
  recordApiKeyCreated(tags?: MetricTags) {
    this.increment('api_key.created', tags);
  }

  recordApiKeyUsed(keyId: string, tags?: MetricTags) {
    this.increment('api_key.used', { keyId, ...tags });
  }

  // Error Metrics
  recordError(error: string, context: string, tags?: MetricTags) {
    this.increment('error.count', { error, context, ...tags });
  }

  // Core metric methods
  increment(metric: string, tags?: MetricTags) {
    try {
      const tagArray = this.formatTags(tags);
      this.statsd.increment(metric, 1, 1, tagArray);
      this.tracer.increment(metric, tags);
    } catch (error) {
      this.logger.error(`Failed to increment metric ${metric}`, error);
    }
  }

  gauge(metric: string, value: number, tags?: MetricTags) {
    try {
      const tagArray = this.formatTags(tags);
      this.statsd.gauge(metric, value, 1, tagArray);
      this.tracer.gauge(metric, value, tags);
    } catch (error) {
      this.logger.error(`Failed to record gauge ${metric}`, error);
    }
  }

  histogram(metric: string, value: number, tags?: MetricTags) {
    try {
      const tagArray = this.formatTags(tags);
      this.statsd.histogram(metric, value, 1, tagArray);
      this.tracer.histogram(metric, value, tags);
    } catch (error) {
      this.logger.error(`Failed to record histogram ${metric}`, error);
    }
  }

  timing(metric: string, duration: number, tags?: MetricTags) {
    try {
      const tagArray = this.formatTags(tags);
      this.statsd.timing(metric, duration, 1, tagArray);
    } catch (error) {
      this.logger.error(`Failed to record timing ${metric}`, error);
    }
  }

  private formatTags(tags?: MetricTags): string[] {
    if (!tags) return [];
    
    return Object.entries(tags)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}:${value}`);
  }

  // Utility method for measuring operation duration
  async measureDuration<T>(
    operation: string,
    fn: () => Promise<T>,
    tags?: MetricTags
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.timing(`operation.${operation}.duration`, duration, { ...tags, status: 'success' });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.timing(`operation.${operation}.duration`, duration, { ...tags, status: 'failure' });
      this.increment(`operation.${operation}.error`, tags);
      throw error;
    }
  }
}