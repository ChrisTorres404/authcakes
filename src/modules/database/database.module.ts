// src/modules/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from '../settings/entities/system-setting.entity';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantMembership } from '../tenants/entities/tenant-membership.entity';
import { SeederService } from './seeds/seeder.service';
import { Log } from '../logs/entities/log.entity';
import { ApiKey } from '../api/entities/api-key.entity';
import { MfaRecoveryCode } from '../auth/entities/mfa-recovery-code.entity';
import { WebauthnCredential } from '../auth/entities/webauthn-credential.entity';
import { UserDevice } from '../auth/entities/user-device.entity';
import { TenantInvitation } from '../tenants/entities/tenant-invitation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SystemSetting,
      User,
      Tenant,
      TenantMembership,
      Log,
      ApiKey,
      MfaRecoveryCode,
      WebauthnCredential,
      UserDevice,
      TenantInvitation,
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class DatabaseModule {}
