export interface RateLimitConfig {
    ttl: number;
    limit: number;
}
export interface AuthRateLimits {
    login: RateLimitConfig;
    register: RateLimitConfig;
    passwordReset: RateLimitConfig;
    refresh: RateLimitConfig;
}
export interface ApiRateLimits {
    read: RateLimitConfig;
    write: RateLimitConfig;
}
export interface ThrottlerConfig {
    default: RateLimitConfig;
    auth: AuthRateLimits;
    api: ApiRateLimits;
    admin: RateLimitConfig;
    skipIf: {
        ips: string[];
    };
}
declare const _default: (() => ThrottlerConfig) & import("@nestjs/config").ConfigFactoryKeyHost<ThrottlerConfig>;
export default _default;
