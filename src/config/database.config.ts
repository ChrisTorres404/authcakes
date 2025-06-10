// src/config/database.config.ts
import { registerAs } from '@nestjs/config';

/** Supported database types for the application */
type SupportedDatabaseType =
  | 'postgres'
  | 'mysql'
  | 'sqlite'
  | 'mariadb'
  | 'mongodb';

/** Database configuration interface */
export interface DatabaseConfig {
  type: SupportedDatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  synchronize: boolean;
  logging: boolean;
  ssl: boolean;
  migrationsRun: boolean;
  // Connection pooling configuration
  poolSize: number;
  poolMaxConnections: number;
  poolIdleTimeout: number;
  poolAcquireTimeout: number;
  poolValidateConnection: boolean;
  // Connection retry configuration
  retryAttempts: number;
  retryDelay: number;
  // Statement timeout configuration
  statementTimeout: number;
  queryTimeout: number;
}

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    type: (process.env.DB_TYPE as SupportedDatabaseType) || 'postgres',
    // Support both DB_* and PG_* prefixes for consistent configuration
    host: process.env.DB_HOST || process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.PG_PORT || '5432', 10),
    username: process.env.DB_USERNAME || process.env.PG_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PG_PASSWORD || 'postgres',
    name: process.env.DB_NAME || process.env.PG_DATABASE || 'authcakes',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true',
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
    // Connection pooling configuration with enterprise-grade defaults
    poolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
    poolMaxConnections: parseInt(process.env.DB_POOL_MAX || '100', 10),
    poolIdleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '10000', 10), // 10 seconds
    poolAcquireTimeout: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000', 10), // 60 seconds
    poolValidateConnection: process.env.DB_POOL_VALIDATE !== 'false', // Default true
    // Connection retry configuration
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '10', 10),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000', 10), // 3 seconds
    // Statement timeout configuration
    statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000', 10), // 30 seconds
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10), // 30 seconds
  }),
);
