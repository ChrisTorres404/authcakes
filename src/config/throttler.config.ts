import { registerAs } from '@nestjs/config';

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

export default registerAs(
  'throttler',
  (): ThrottlerConfig => ({
    // Default rate limit for general endpoints
    default: {
      ttl: 60, // Time window in seconds
      limit: 100, // Number of requests allowed in the time window
    },

    // Specific rate limits for different endpoint types
    auth: {
      login: {
        ttl: 900, // 15 minutes
        limit: 5, // 5 login attempts per 15 minutes
      },
      register: {
        ttl: 3600, // 1 hour
        limit: 3, // 3 registration attempts per hour
      },
      passwordReset: {
        ttl: 3600, // 1 hour
        limit: 3, // 3 password reset requests per hour
      },
      refresh: {
        ttl: 60, // 1 minute
        limit: 10, // 10 refresh attempts per minute
      },
    },

    // API endpoints rate limits
    api: {
      read: {
        ttl: 60, // 1 minute
        limit: 100, // 100 read requests per minute
      },
      write: {
        ttl: 60, // 1 minute
        limit: 30, // 30 write requests per minute
      },
    },

    // Admin endpoints (more restrictive)
    admin: {
      ttl: 60, // 1 minute
      limit: 20, // 20 requests per minute
    },

    // Skip throttling for certain IPs (e.g., monitoring services)
    skipIf: {
      // Add IP addresses or conditions to skip throttling
      ips: process.env.THROTTLER_SKIP_IPS?.split(',') || [],
    },
  }),
);
