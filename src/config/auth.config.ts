// src/config/auth.config.ts
import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  jwt: {
    secret: string;
    refreshSecret?: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  password: {
    bcryptRounds: number;
    minLength: number;
    requireNumbers: boolean;
    requireSpecial: boolean;
  };
  mfa: {
    enabled: boolean;
    totpWindow: number;
  };
  cookies: {
    domain: string;
    secure: boolean;
    sameSite: string;
  };
  security: {
    maxFailedAttempts: number;
    lockDurationMinutes: number;
  };
}

export default registerAs(
  'auth',
  (): AuthConfig => {
    // Critical security validations - fail fast if not configured properly
    const jwtSecret = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.AUTH_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET;
    
    if (!jwtSecret || jwtSecret === 'changeme') {
      throw new Error(
        'SECURITY ERROR: JWT_SECRET must be set with a secure value. ' +
        'Generate one with: openssl rand -base64 64'
      );
    }
    
    if (!jwtRefreshSecret || jwtRefreshSecret === jwtSecret) {
      throw new Error(
        'SECURITY ERROR: JWT_REFRESH_SECRET must be set and different from JWT_SECRET. ' +
        'Generate one with: openssl rand -base64 64'
      );
    }
    
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      jwt: {
        secret: jwtSecret,
        refreshSecret: jwtRefreshSecret,
        accessExpiresIn: process.env.AUTH_JWT_ACCESS_EXPIRES_IN || '900',
        refreshExpiresIn: process.env.AUTH_JWT_REFRESH_EXPIRES_IN || '604800',
      },
      password: {
        bcryptRounds: parseInt(
          process.env.AUTH_PASSWORD_BCRYPT_ROUNDS || '12', // Increased from 10
          10,
        ),
        minLength: parseInt(process.env.AUTH_PASSWORD_MIN_LENGTH || '12', 10), // Increased from 8
        requireNumbers: process.env.AUTH_PASSWORD_REQUIRE_NUMBERS !== 'false', // Default true
        requireSpecial: process.env.AUTH_PASSWORD_REQUIRE_SPECIAL !== 'false', // Default true
      },
      mfa: {
        enabled: process.env.AUTH_MFA_ENABLED !== 'false', // Default true for production
        totpWindow: parseInt(process.env.AUTH_MFA_TOTP_WINDOW || '1', 10),
      },
      cookies: {
        domain: process.env.AUTH_COOKIE_DOMAIN || '',
        secure: isProduction || process.env.AUTH_COOKIE_SECURE === 'true',
        sameSite: process.env.AUTH_COOKIE_SAMESITE || 'strict', // Changed from 'lax'
      },
      security: {
        maxFailedAttempts: parseInt(
          process.env.AUTH_SECURITY_MAX_FAILED_ATTEMPTS || '5',
          10,
        ),
        lockDurationMinutes: parseInt(
          process.env.AUTH_SECURITY_LOCK_DURATION_MINUTES || '30',
          10,
        ),
      },
    };
  },
);
