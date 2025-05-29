"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSourceOptions = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const validation_schema_1 = require("./validation.schema");
(0, dotenv_1.config)();
const validationResult = validation_schema_1.validationSchema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
});
const error = validationResult.error;
const envVars = validationResult.value;
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}
console.log('TypeORM DataSource configuration:', {
    host: envVars.DB_HOST || envVars.PG_HOST || 'localhost',
    port: envVars.DB_PORT || envVars.PG_PORT || '5432',
    username: envVars.DB_USERNAME || envVars.PG_USER || 'authcakes_user',
    database: envVars.DB_NAME || envVars.PG_DATABASE || 'authcakes_dev',
    type: envVars.DB_TYPE || 'postgres',
});
exports.dataSourceOptions = {
    type: 'postgres',
    host: envVars.DB_HOST || envVars.PG_HOST || 'localhost',
    port: parseInt(envVars.DB_PORT || envVars.PG_PORT || '5432', 10),
    username: envVars.DB_USERNAME || envVars.PG_USER || 'authcakes_user',
    password: envVars.DB_PASSWORD || envVars.PG_PASSWORD || 'authcakes_password',
    database: envVars.DB_NAME || envVars.PG_DATABASE || 'authcakes_dev',
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/**/*{.ts,.js}'],
    synchronize: envVars.DB_SYNCHRONIZE === 'true',
    logging: envVars.DB_LOGGING === 'true',
};
const dataSource = new typeorm_1.DataSource(exports.dataSourceOptions);
exports.default = dataSource;
//# sourceMappingURL=data-source.js.map