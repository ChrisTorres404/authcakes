import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';

// Services
import { MigrationOrchestrator } from './services/migration-orchestrator.service';
import { UserMigrationService } from './services/user-migration.service';
import { TenantMigrationService } from './services/tenant-migration.service';
import { SecurityMigrationService } from './services/security-migration.service';
import { LookupDataService } from './services/lookup-data.service';
import { ValidationService } from './services/validation.service';
import { RollbackService } from './services/rollback.service';

// Commands
import { MigrateCommand } from './commands/migrate.command';
import { ValidateCommand } from './commands/validate.command';
import { RollbackCommand } from './commands/rollback.command';
import { SetupLookupDataCommand } from './commands/setup-lookup-data.command';

// Entities for tracking
import { MigrationLog } from './entities/migration-log.entity';
import { MigrationCheckpoint } from './entities/migration-checkpoint.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MigrationLog,
      MigrationCheckpoint,
    ]),
    DatabaseModule,
    UsersModule,
    TenantsModule,
    AuthModule,
    SettingsModule,
  ],
  providers: [
    // Services
    MigrationOrchestrator,
    UserMigrationService,
    TenantMigrationService,
    SecurityMigrationService,
    LookupDataService,
    ValidationService,
    RollbackService,
    
    // Commands
    MigrateCommand,
    ValidateCommand,
    RollbackCommand,
    SetupLookupDataCommand,
  ],
  exports: [
    MigrationOrchestrator,
    ValidationService,
  ],
})
export class MigrationModule {}