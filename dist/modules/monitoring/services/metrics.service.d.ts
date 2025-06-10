export interface MetricTags {
    [key: string]: string | number;
}
export declare class MetricsService {
    private readonly logger;
    private readonly tracer;
    private statsd;
    constructor();
    private initializeStatsD;
    recordLogin(success: boolean, method?: string, tags?: MetricTags): void;
    recordRegistration(success: boolean, tags?: MetricTags): void;
    recordPasswordChange(success: boolean, tags?: MetricTags): void;
    recordAccountRecovery(stage: 'requested' | 'completed' | 'failed', tags?: MetricTags): void;
    recordMfaEvent(event: 'enabled' | 'disabled' | 'verified' | 'failed', method: string, tags?: MetricTags): void;
    recordSessionCreated(tags?: MetricTags): void;
    recordSessionRevoked(reason: 'logout' | 'expired' | 'security' | 'admin', tags?: MetricTags): void;
    recordTokenRefresh(success: boolean, tags?: MetricTags): void;
    recordTenantCreated(tags?: MetricTags): void;
    recordTenantMemberAdded(role: string, tags?: MetricTags): void;
    recordTenantInvitation(event: 'sent' | 'accepted' | 'expired' | 'cancelled', tags?: MetricTags): void;
    recordSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', tags?: MetricTags): void;
    recordBruteForceAttempt(endpoint: string, tags?: MetricTags): void;
    recordRateLimitHit(endpoint: string, tags?: MetricTags): void;
    recordApiLatency(endpoint: string, duration: number, tags?: MetricTags): void;
    recordDatabaseQuery(operation: string, table: string, duration: number, tags?: MetricTags): void;
    recordCacheHit(key: string, hit: boolean, tags?: MetricTags): void;
    recordApiKeyCreated(tags?: MetricTags): void;
    recordApiKeyUsed(keyId: string, tags?: MetricTags): void;
    recordError(error: string, context: string, tags?: MetricTags): void;
    increment(metric: string, tags?: MetricTags): void;
    gauge(metric: string, value: number, tags?: MetricTags): void;
    histogram(metric: string, value: number, tags?: MetricTags): void;
    timing(metric: string, duration: number, tags?: MetricTags): void;
    private formatTags;
    measureDuration<T>(operation: string, fn: () => Promise<T>, tags?: MetricTags): Promise<T>;
}
