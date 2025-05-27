import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedCommand } from './commands/seed.command';
import { TruncateTablesCommand } from './commands/truncate-tables.command';
import { ResetDatabaseCommand } from './commands/reset-database.command';
import { VerifyDbConnectionCommand } from './commands/verify-db-connection.command';

// Import config files to ensure they're available
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import throttlerConfig from './config/throttler.config';
import { validationSchema } from './config/validation.schema';

@Module({
  imports: [
    // Global Configuration with all config files loaded
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, throttlerConfig],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    
    // Database connection - same as in AppModule
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
    
    DatabaseModule,
  ],
  providers: [
    SeedCommand,
    TruncateTablesCommand,
    ResetDatabaseCommand,
    VerifyDbConnectionCommand,
  ],
})
export class CliModule {}
