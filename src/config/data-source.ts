// src/config/data-source.ts
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { config } from 'dotenv';
import { validationSchema } from './validation.schema';
import { ValidationResult } from 'joi';

/**
 * Database configuration interface representing validated environment variables
 */
interface DatabaseEnvConfig {
  DB_TYPE?: 'postgres';
  DB_HOST?: string;
  PG_HOST?: string;
  DB_PORT?: string;
  PG_PORT?: string;
  DB_USERNAME?: string;
  PG_USER?: string;
  DB_PASSWORD?: string;
  PG_PASSWORD?: string;
  DB_NAME?: string;
  PG_DATABASE?: string;
  DB_SYNCHRONIZE?: string;
  DB_LOGGING?: string;
}

// Load environment variables
config();

// Validate environment variables using Joi schema
// allowUnknown: true is required because process.env contains many system variables not relevant to app config
const validationResult = validationSchema.validate(process.env, {
  abortEarly: false,
  allowUnknown: true,
}) as ValidationResult<DatabaseEnvConfig>;
const error = validationResult.error;
const envVars = validationResult.value;

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

/**
 * Log non-sensitive database configuration for audit/debug purposes
 * Explicitly excludes password for security
 */
console.log('TypeORM DataSource configuration:', {
  host: envVars.DB_HOST || envVars.PG_HOST || 'localhost',
  port: envVars.DB_PORT || envVars.PG_PORT || '5432',
  username: envVars.DB_USERNAME || envVars.PG_USER || 'authcakes_user',
  database: envVars.DB_NAME || envVars.PG_DATABASE || 'authcakes_dev',
  type: envVars.DB_TYPE || 'postgres',
});

/**
 * TypeORM DataSource configuration options
 * Supports both DB_* and PG_* environment variables for flexibility
 */
export const dataSourceOptions: PostgresConnectionOptions = {
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

// Create and export a new data source
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
