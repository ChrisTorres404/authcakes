// src/modules/users/users.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { MfaRecoveryCode } from '../auth/entities/mfa-recovery-code.entity';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { AuthModule } from '../auth/auth.module';
import { AuditLogService } from '../auth/services/audit-log.service';
import { TenantsModule } from '../tenants/tenants.module';
import { SettingsModule } from '../settings/settings.module';
import { ProfileUpdateGuard } from './guards/profile-update.guard';
import { Log } from '../logs/entities/log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Log, MfaRecoveryCode]),
    forwardRef(() => AuthModule),
    TenantsModule,
    SettingsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, AuditLogService, ProfileUpdateGuard],
  exports: [UsersService],
})
export class UsersModule {}
