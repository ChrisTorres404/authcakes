"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('database', () => ({
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST || process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.PG_PORT || '5432', 10),
    username: process.env.DB_USERNAME || process.env.PG_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PG_PASSWORD || 'postgres',
    name: process.env.DB_NAME || process.env.PG_DATABASE || 'authcakes',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true',
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
}));
//# sourceMappingURL=database.config.js.map