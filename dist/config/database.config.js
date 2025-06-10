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
    poolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
    poolMaxConnections: parseInt(process.env.DB_POOL_MAX || '100', 10),
    poolIdleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '10000', 10),
    poolAcquireTimeout: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000', 10),
    poolValidateConnection: process.env.DB_POOL_VALIDATE !== 'false',
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '10', 10),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000', 10),
    statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000', 10),
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),
}));
//# sourceMappingURL=database.config.js.map