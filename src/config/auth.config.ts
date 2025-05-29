// src/config/auth.config.ts
import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  jwt: {
    secret: string;
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
  (): AuthConfig => ({
    jwt: {
      secret: process.env.AUTH_JWT_SECRET || 'changeme',
      accessExpiresIn: process.env.AUTH_JWT_ACCESS_EXPIRES_IN || '900',
      refreshExpiresIn: process.env.AUTH_JWT_REFRESH_EXPIRES_IN || '604800',
    },
    password: {
      bcryptRounds: parseInt(
        process.env.AUTH_PASSWORD_BCRYPT_ROUNDS || '10',
        10,
      ),
      minLength: parseInt(process.env.AUTH_PASSWORD_MIN_LENGTH || '8', 10),
      requireNumbers: process.env.AUTH_PASSWORD_REQUIRE_NUMBERS === 'true',
      requireSpecial: process.env.AUTH_PASSWORD_REQUIRE_SPECIAL === 'true',
    },
    mfa: {
      enabled: process.env.AUTH_MFA_ENABLED === 'true',
      totpWindow: parseInt(process.env.AUTH_MFA_TOTP_WINDOW || '1', 10),
    },
    cookies: {
      domain: process.env.AUTH_COOKIE_DOMAIN || '',
      secure: process.env.AUTH_COOKIE_SECURE === 'true',
      sameSite: process.env.AUTH_COOKIE_SAMESITE || 'lax',
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
  }),
);
