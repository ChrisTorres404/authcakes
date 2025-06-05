"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('throttler', () => {
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
    const isDevEnv = process.env.NODE_ENV === 'development';
    const testMultiplier = isTestEnv ? 100 : (isDevEnv ? 10 : 1);
    return {
        default: {
            ttl: 60,
            limit: 100 * testMultiplier,
        },
        auth: {
            login: {
                ttl: 900,
                limit: 5 * testMultiplier,
            },
            register: {
                ttl: 3600,
                limit: 3 * testMultiplier,
            },
            passwordReset: {
                ttl: 3600,
                limit: 3 * testMultiplier,
            },
            refresh: {
                ttl: 60,
                limit: 10 * testMultiplier,
            },
        },
        api: {
            read: {
                ttl: 60,
                limit: 100 * testMultiplier,
            },
            write: {
                ttl: 60,
                limit: 30 * testMultiplier,
            },
        },
        admin: {
            ttl: 60,
            limit: 20 * testMultiplier,
        },
        skipIf: {
            ips: process.env.THROTTLER_SKIP_IPS?.split(',') || [],
        },
    };
});
//# sourceMappingURL=throttler.config.js.map