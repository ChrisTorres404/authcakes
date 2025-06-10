"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('system', () => {
    const apiKeys = process.env.SYSTEM_API_KEYS
        ? process.env.SYSTEM_API_KEYS.split(',').map(key => key.trim())
        : [];
    const activeClients = process.env.SYSTEM_ACTIVE_CLIENTS
        ? process.env.SYSTEM_ACTIVE_CLIENTS.split(',').map(client => client.trim())
        : ['default-client'];
    return {
        apiKeys,
        jwtSecret: process.env.SYSTEM_JWT_SECRET || process.env.JWT_SECRET || 'system-secret-key',
        jwtIssuer: process.env.SYSTEM_JWT_ISSUER || 'AuthCakes-API',
        jwtAudience: process.env.SYSTEM_JWT_AUDIENCE || 'AuthCakes-System',
        jwtExpirationMinutes: parseInt(process.env.SYSTEM_JWT_EXPIRATION_MINUTES || '1440', 10),
        activeClients,
        requireSystemAuth: process.env.REQUIRE_SYSTEM_AUTH === 'true',
    };
});
//# sourceMappingURL=system.config.js.map