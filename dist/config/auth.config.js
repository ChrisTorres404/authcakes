"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('auth', () => {
    const jwtSecret = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.AUTH_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET;
    if (!jwtSecret || jwtSecret === 'changeme') {
        throw new Error('SECURITY ERROR: JWT_SECRET must be set with a secure value. ' +
            'Generate one with: openssl rand -base64 64');
    }
    if (!jwtRefreshSecret || jwtRefreshSecret === jwtSecret) {
        throw new Error('SECURITY ERROR: JWT_REFRESH_SECRET must be set and different from JWT_SECRET. ' +
            'Generate one with: openssl rand -base64 64');
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
            bcryptRounds: parseInt(process.env.AUTH_PASSWORD_BCRYPT_ROUNDS || '12', 10),
            minLength: parseInt(process.env.AUTH_PASSWORD_MIN_LENGTH || '12', 10),
            requireNumbers: process.env.AUTH_PASSWORD_REQUIRE_NUMBERS !== 'false',
            requireSpecial: process.env.AUTH_PASSWORD_REQUIRE_SPECIAL !== 'false',
        },
        mfa: {
            enabled: process.env.AUTH_MFA_ENABLED !== 'false',
            totpWindow: parseInt(process.env.AUTH_MFA_TOTP_WINDOW || '1', 10),
        },
        cookies: {
            domain: process.env.AUTH_COOKIE_DOMAIN || '',
            secure: isProduction || process.env.AUTH_COOKIE_SECURE === 'true',
            sameSite: process.env.AUTH_COOKIE_SAMESITE || 'strict',
        },
        security: {
            maxFailedAttempts: parseInt(process.env.AUTH_SECURITY_MAX_FAILED_ATTEMPTS || '5', 10),
            lockDurationMinutes: parseInt(process.env.AUTH_SECURITY_LOCK_DURATION_MINUTES || '30', 10),
        },
    };
});
//# sourceMappingURL=auth.config.js.map