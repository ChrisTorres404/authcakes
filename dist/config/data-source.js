"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSourceOptions = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const fs = require("fs");
const path = require("path");
const validation_schema_1 = require("./validation.schema");
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
const envPath = path.resolve(process.cwd(), envFile);
if (fs.existsSync(envPath)) {
    console.log(`Loading environment from ${envFile}`);
    (0, dotenv_1.config)({ path: envPath });
}
else {
    console.log(`Environment file ${envFile} not found, using default .env`);
    (0, dotenv_1.config)();
}
const validationResult = validation_schema_1.validationSchema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
});
const error = validationResult.error;
const envVars = validationResult.value;
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}
const dbName = envVars.DB_NAME || envVars.PG_DATABASE ||
    (process.env.NODE_ENV === 'test' ? 'authcakes_test' : 'authcakes_dev');
console.log(`TypeORM DataSource configuration (${process.env.NODE_ENV || 'development'} environment):`, {
    host: envVars.DB_HOST || envVars.PG_HOST || 'localhost',
    port: envVars.DB_PORT || envVars.PG_PORT || '5432',
    username: envVars.DB_USERNAME || envVars.PG_USER || 'authcakes_user',
    database: dbName,
    type: envVars.DB_TYPE || 'postgres',
    synchronize: envVars.DB_SYNCHRONIZE === 'true',
    logging: envVars.DB_LOGGING === 'true',
});
exports.dataSourceOptions = {
    type: 'postgres',
    host: envVars.DB_HOST || envVars.PG_HOST || 'localhost',
    port: parseInt(envVars.DB_PORT || envVars.PG_PORT || '5432', 10),
    username: envVars.DB_USERNAME || envVars.PG_USER || 'authcakes_user',
    password: envVars.DB_PASSWORD || envVars.PG_PASSWORD || 'authcakes_password',
    database: dbName,
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/**/*{.ts,.js}'],
    synchronize: envVars.DB_SYNCHRONIZE === 'true',
    logging: envVars.DB_LOGGING === 'true',
    migrationsRun: process.env.NODE_ENV === 'test' || envVars.DB_MIGRATIONS_RUN === 'true',
    extra: {
        min: parseInt(process.env.DB_POOL_MIN || '2', 10),
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '10000', 10),
        acquireTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000', 10),
        createTimeoutMillis: parseInt(process.env.DB_POOL_CREATE_TIMEOUT || '30000', 10),
        validateConnection: process.env.DB_POOL_VALIDATE !== 'false',
        statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000', 10),
        query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),
        application_name: `authcakes-${process.env.NODE_ENV || 'development'}`,
        retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '10', 10),
        retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000', 10),
        ssl: process.env.DB_SSL === 'true' ? {
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
            ca: process.env.DB_SSL_CA,
            cert: process.env.DB_SSL_CERT,
            key: process.env.DB_SSL_KEY,
        } : false,
    },
};
const dataSource = new typeorm_1.DataSource(exports.dataSourceOptions);
if (process.env.NODE_ENV === 'test' && dbName !== 'authcakes_test') {
    console.warn('⚠️ WARNING: Running in test environment but not using test database! ' +
        'This may cause conflicts with development data.');
}
exports.default = dataSource;
//# sourceMappingURL=data-source.js.map