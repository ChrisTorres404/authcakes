"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productionSeedData = void 0;
exports.productionSeedData = {
    environment: 'production',
    systemSettings: [
        {
            key: 'auth.password.minLength',
            value: '12',
            type: 'number',
            description: 'Minimum password length',
        },
        {
            key: 'auth.password.requireNumbers',
            value: 'true',
            type: 'boolean',
            description: 'Require numbers in password',
        },
        {
            key: 'auth.password.requireSpecial',
            value: 'true',
            type: 'boolean',
            description: 'Require special characters in password',
        },
        {
            key: 'auth.password.requireUppercase',
            value: 'true',
            type: 'boolean',
            description: 'Require uppercase letters in password',
        },
        {
            key: 'auth.password.bcryptRounds',
            value: '12',
            type: 'number',
            description: 'Bcrypt hashing rounds',
        },
        {
            key: 'auth.jwt.accessExpiresIn',
            value: '900',
            type: 'number',
            description: 'Access token expiration in seconds',
        },
        {
            key: 'auth.jwt.refreshExpiresIn',
            value: '2592000',
            type: 'number',
            description: 'Refresh token expiration in seconds',
        },
        {
            key: 'auth.mfa.enabled',
            value: 'true',
            type: 'boolean',
            description: 'MFA enabled by default',
        },
        {
            key: 'auth.session.timeout',
            value: '3600',
            type: 'number',
            description: 'Session timeout in seconds',
        },
        {
            key: 'auth.accountRecovery.expiresIn',
            value: '3600',
            type: 'number',
            description: 'Account recovery token expiration in seconds',
        },
        {
            key: 'auth.accountVerification.required',
            value: 'true',
            type: 'boolean',
            description: 'Email verification required',
        },
        {
            key: 'auth.security.maxFailedAttempts',
            value: '5',
            type: 'number',
            description: 'Maximum failed login attempts before lockout',
        },
        {
            key: 'auth.security.lockDuration',
            value: '1800',
            type: 'number',
            description: 'Account lock duration in seconds',
        },
        {
            key: 'auth.profileUpdate.restrictedFields',
            value: '["email","role","active","emailVerified"]',
            type: 'json',
            description: 'Fields that cannot be updated by users',
        },
    ],
    users: [],
    tenants: [],
    tenantMemberships: [],
    apiKeys: [],
    includeDemoData: false,
};
//# sourceMappingURL=production.seed-data.js.map