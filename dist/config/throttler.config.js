"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('throttler', () => ({
    default: {
        ttl: 60,
        limit: 100,
    },
    auth: {
        login: {
            ttl: 900,
            limit: 5,
        },
        register: {
            ttl: 3600,
            limit: 3,
        },
        passwordReset: {
            ttl: 3600,
            limit: 3,
        },
        refresh: {
            ttl: 60,
            limit: 10,
        },
    },
    api: {
        read: {
            ttl: 60,
            limit: 100,
        },
        write: {
            ttl: 60,
            limit: 30,
        },
    },
    admin: {
        ttl: 60,
        limit: 20,
    },
    skipIf: {
        ips: process.env.THROTTLER_SKIP_IPS?.split(',') || [],
    },
}));
//# sourceMappingURL=throttler.config.js.map