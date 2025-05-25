// src/config/data-source.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { validationSchema } from './validation.schema';
import * as Joi from 'joi';

// Load environment variables
dotenv.config();

// Validate environment variables using Joi schema
// allowUnknown: true is required because process.env contains many system variables not relevant to app config
const { error, value: envVars } = validationSchema.validate(process.env, { abortEarly: false, allowUnknown: true });
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Log non-sensitive DB config for audit/debug (do not log password)
console.log('TypeORM DataSource config:', {
  host: envVars.DB_HOST || envVars.PG_HOST,
  port: envVars.DB_PORT || envVars.PG_PORT,
  username: envVars.DB_USERNAME || envVars.PG_USER,
  database: envVars.DB_NAME || envVars.PG_DATABASE,
  type: envVars.DB_TYPE || 'postgres',
});

// Define the configuration for TypeORM
export const dataSourceOptions: DataSourceOptions = {
  type: (envVars.DB_TYPE as any) || 'postgres',
  host: envVars.DB_HOST || envVars.PG_HOST || 'localhost',
  port: parseInt(envVars.DB_PORT || envVars.PG_PORT || '5432', 10),
  username: envVars.DB_USERNAME || envVars.PG_USER || 'authcakes_user',
  password: envVars.DB_PASSWORD || envVars.PG_PASSWORD || 'authcakes_password',
  database: envVars.DB_NAME || envVars.PG_DATABASE || 'authcakes_dev',
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/**/*{.ts,.js}'],
  synchronize: envVars.DB_SYNCHRONIZE === true || envVars.DB_SYNCHRONIZE === 'true',
  logging: envVars.DB_LOGGING === true || envVars.DB_LOGGING === 'true',
};

// Create and export a new data source
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;