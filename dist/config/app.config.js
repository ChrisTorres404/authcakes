"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('app', () => ({
    port: parseInt(process.env.APP_PORT || '3000', 10),
    environment: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.APP_CORS_ORIGINS
        ? process.env.APP_CORS_ORIGINS.split(',')
        : ['*'],
    baseUrl: process.env.APP_BASE_URL ||
        `http://localhost:${process.env.APP_PORT || '3000'}`,
}));
//# sourceMappingURL=app.config.js.map