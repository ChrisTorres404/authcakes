// src/config/data-source.ts
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
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

// Determine which env file to load based on NODE_ENV
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
const envPath = path.resolve(process.cwd(), envFile);

// Check if env file exists
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envFile}`);
  config({ path: envPath });
} else {
  console.log(`Environment file ${envFile} not found, using default .env`);
  config();
}

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

// Determine database name - for better visibility in logs
const dbName = envVars.DB_NAME || envVars.PG_DATABASE || 
  (process.env.NODE_ENV === 'test' ? 'authcakes_test' : 'authcakes_dev');

/**
 * Log non-sensitive database configuration for audit/debug purposes
 * Explicitly excludes password for security
 */
console.log(`TypeORM DataSource configuration (${process.env.NODE_ENV || 'development'} environment):`, {
  host: envVars.DB_HOST || envVars.PG_HOST || 'localhost',
  port: envVars.DB_PORT || envVars.PG_PORT || '5432',
  username: envVars.DB_USERNAME || envVars.PG_USER || 'authcakes_user',
  database: dbName,
  type: envVars.DB_TYPE || 'postgres',
  synchronize: envVars.DB_SYNCHRONIZE === 'true',
  logging: envVars.DB_LOGGING === 'true',
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
  database: dbName,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/**/*{.ts,.js}'],
  synchronize: envVars.DB_SYNCHRONIZE === 'true',
  logging: envVars.DB_LOGGING === 'true',
  // Add migration logging for troubleshooting
  migrationsRun: process.env.NODE_ENV === 'test' || envVars.DB_MIGRATIONS_RUN === 'true',
  
  // Connection pooling configuration for production-ready performance
  extra: {
    // Pool size configuration
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    
    // Connection timeout settings
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '10000', 10),
    acquireTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000', 10),
    createTimeoutMillis: parseInt(process.env.DB_POOL_CREATE_TIMEOUT || '30000', 10),
    
    // Connection validation
    validateConnection: process.env.DB_POOL_VALIDATE !== 'false',
    
    // Statement timeout for preventing long-running queries
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000', 10),
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),
    
    // Application name for database monitoring
    application_name: `authcakes-${process.env.NODE_ENV || 'development'}`,
    
    // Connection retry configuration
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '10', 10),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000', 10),
    
    // SSL configuration for production
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      ca: process.env.DB_SSL_CA,
      cert: process.env.DB_SSL_CERT,
      key: process.env.DB_SSL_KEY,
    } : false,
  },
};

// Create and export a new data source
const dataSource = new DataSource(dataSourceOptions);

// Log a warning if we're in test mode but not using test database
if (process.env.NODE_ENV === 'test' && dbName !== 'authcakes_test') {
  console.warn(
    '⚠️ WARNING: Running in test environment but not using test database! ' +
    'This may cause conflicts with development data.'
  );
}
export default dataSource;
