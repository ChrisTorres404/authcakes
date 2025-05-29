// src/config/app.config.ts
import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  environment: string;
  corsOrigins: string[];
  baseUrl: string;
}

export default registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.APP_PORT || '3000', 10),
    environment: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.APP_CORS_ORIGINS
      ? process.env.APP_CORS_ORIGINS.split(',')
      : ['*'],
    baseUrl:
      process.env.APP_BASE_URL ||
      `http://localhost:${process.env.APP_PORT || '3000'}`,
  }),
);
