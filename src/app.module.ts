// src/app.module.ts

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import throttlerConfig from './config/throttler.config';
import { validationSchema } from './config/validation.schema';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { DatabaseModule } from './modules/database/database.module';

import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantAuthGuard } from './common/guards/tenant-auth.guard';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { SeedCommand } from './commands/seed.command';

@Module({
  imports: [
    // Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, throttlerConfig],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    // Database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
      }),
    }),

    // Global rate limiting with more reasonable defaults
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: configService.get<number>('throttler.default.ttl', 60),
            limit: configService.get<number>('throttler.default.limit', 100),
          },
        ],
        storage: undefined,
        skipIf: (context) => {
          // Skip throttling in test environment
          if (process.env.NODE_ENV === 'test' || process.env.THROTTLE_SKIP === 'true') {
            return true;
          }
          const request = context.switchToHttp().getRequest();
          return request.url === '/api/health';
        },
      }),
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    TenantsModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // SeedCommand removed to avoid DI conflicts with CliModule

    // Global Guards - Order matters! Throttler should be first
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    Reflector,

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },

    // Global Filters
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}