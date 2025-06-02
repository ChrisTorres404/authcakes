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
  (): ThrottlerConfig => {
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
    const isDevEnv = process.env.NODE_ENV === 'development';
    
    // Relaxed limits for test/dev environments while maintaining security
    const testMultiplier = isTestEnv ? 100 : (isDevEnv ? 10 : 1);
    
    return {
      // Default rate limit for general endpoints
      default: {
        ttl: 60, // Time window in seconds
        limit: 100 * testMultiplier, // Scale up for test environments
      },

      // Specific rate limits for different endpoint types
      auth: {
        login: {
          ttl: 900, // 15 minutes
          limit: 5 * testMultiplier, // Scale login attempts for testing
        },
        register: {
          ttl: 3600, // 1 hour
          limit: 3 * testMultiplier, // Scale registration attempts for testing
        },
        passwordReset: {
          ttl: 3600, // 1 hour
          limit: 3 * testMultiplier, // Scale password reset attempts for testing
        },
        refresh: {
          ttl: 60, // 1 minute
          limit: 10 * testMultiplier, // Scale refresh attempts for testing
        },
      },

      // API endpoints rate limits
      api: {
        read: {
          ttl: 60, // 1 minute
          limit: 100 * testMultiplier, // Scale read requests for testing
        },
        write: {
          ttl: 60, // 1 minute
          limit: 30 * testMultiplier, // Scale write requests for testing
        },
      },

      // Admin endpoints (more restrictive)
      admin: {
        ttl: 60, // 1 minute
        limit: 20 * testMultiplier, // Scale admin requests for testing
      },

      // Skip throttling for certain IPs (e.g., monitoring services, test environments)
      skipIf: {
        // Add IP addresses or conditions to skip throttling
        ips: process.env.THROTTLER_SKIP_IPS?.split(',') || [],
      },
    };
  },
);
