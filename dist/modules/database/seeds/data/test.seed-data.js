"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSeedData = void 0;
exports.testSeedData = {
    environment: 'test',
    systemSettings: [
        {
            key: 'auth.password.minLength',
            value: '8',
            type: 'number',
            description: 'Minimum password length',
        },
        {
            key: 'auth.password.requireNumbers',
            value: 'false',
            type: 'boolean',
            description: 'Require numbers in password',
        },
        {
            key: 'auth.password.requireSpecial',
            value: 'false',
            type: 'boolean',
            description: 'Require special characters in password',
        },
        {
            key: 'auth.password.requireUppercase',
            value: 'false',
            type: 'boolean',
            description: 'Require uppercase letters in password',
        },
        {
            key: 'auth.password.bcryptRounds',
            value: '10',
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
            value: '604800',
            type: 'number',
            description: 'Refresh token expiration in seconds',
        },
        {
            key: 'auth.mfa.enabled',
            value: 'false',
            type: 'boolean',
            description: 'MFA enabled by default',
        },
        {
            key: 'auth.session.timeout',
            value: '3600',
            type: 'number',
            description: 'Session timeout in seconds',
        },
    ],
    users: [],
    tenants: [],
    tenantMemberships: [],
    apiKeys: [],
    includeDemoData: false,
};
//# sourceMappingURL=test.seed-data.js.map