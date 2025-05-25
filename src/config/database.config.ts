// src/config/database.config.ts
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export interface DatabaseConfig {
  type: 'postgres' | 'mysql' | 'sqlite' | 'mariadb' | 'mongodb';
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  synchronize: boolean;
  logging: boolean;
  ssl: boolean;
  migrationsRun: boolean;
}

export default registerAs('database', (): DatabaseConfig => ({
  type: (process.env.DB_TYPE as any) || 'postgres',
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
}));