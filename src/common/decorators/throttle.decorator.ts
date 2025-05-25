import { SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

// Custom throttle decorators for different endpoint types

/**
 * Rate limit for login endpoints: 5 attempts per 15 minutes
 */
export const ThrottleLogin = () => Throttle({ default: { limit: 5, ttl: 900 } });

/**
 * Rate limit for registration endpoints: 3 attempts per hour
 */
export const ThrottleRegister = () => Throttle({ default: { limit: 3, ttl: 3600 } });

/**
 * Rate limit for password reset endpoints: 3 attempts per hour
 */
export const ThrottlePasswordReset = () => Throttle({ default: { limit: 3, ttl: 3600 } });

/**
 * Rate limit for token refresh endpoints: 10 attempts per minute
 */
export const ThrottleRefresh = () => Throttle({ default: { limit: 10, ttl: 60 } });

/**
 * Rate limit for API read operations: 100 requests per minute
 */
export const ThrottleApiRead = () => Throttle({ default: { limit: 100, ttl: 60 } });

/**
 * Rate limit for API write operations: 30 requests per minute
 */
export const ThrottleApiWrite = () => Throttle({ default: { limit: 30, ttl: 60 } });

/**
 * Skip throttling for this endpoint
 */
export const SkipThrottle = () => SetMetadata('skipThrottle', true); 