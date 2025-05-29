// src/modules/database/seeds/seeder.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface SeederOptions {
  force?: boolean;
}
import { SystemSetting } from '../../settings/entities/system-setting.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantMembership } from '../../tenants/entities/tenant-membership.entity';
import { seedSystemSettings } from './system-settings.seeder';
import { seedUsers } from './users.seeder';
import { seedTenants } from './tenants.seeder';
import { seedTenantMemberships } from './tenant-memberships.seeder';
import { Log } from '../../logs/entities/log.entity';
import { ApiKey } from '../../api/entities/api-key.entity';
import { MfaRecoveryCode } from '../../auth/entities/mfa-recovery-code.entity';
import { WebauthnCredential } from '../../auth/entities/webauthn-credential.entity';
import { UserDevice } from '../../auth/entities/user-device.entity';
import { TenantInvitation } from '../../tenants/entities/tenant-invitation.entity';
import { seedLogs } from './logs.seeder';
import { seedApiKeys } from './api-keys.seeder';
import { seedMfaRecoveryCodes } from './mfa-recovery-codes.seeder';
import { seedWebauthnCredentials } from './webauthn-credentials.seeder';
import { seedUserDevices } from './user-devices.seeder';
import { seedTenantInvitations } from './tenant-invitations.seeder';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(SystemSetting)
    private readonly systemSettingsRepository: Repository<SystemSetting>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantMembership)
    private readonly tenantMembershipRepository: Repository<TenantMembership>,
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(MfaRecoveryCode)
    private readonly mfaRecoveryCodeRepository: Repository<MfaRecoveryCode>,
    @InjectRepository(WebauthnCredential)
    private readonly webauthnCredentialRepository: Repository<WebauthnCredential>,
    @InjectRepository(UserDevice)
    private readonly userDeviceRepository: Repository<UserDevice>,
    @InjectRepository(TenantInvitation)
    private readonly invitationRepository: Repository<TenantInvitation>,
  ) {
    Logger.log('SeederService constructed');
  }

  async seed(options: SeederOptions = {}) {
    console.log('SeederService.seed() called with options:', options);
    this.logger.log(
      'SeederService.seed() called with options: ' + JSON.stringify(options),
    );

    await seedSystemSettings(this.systemSettingsRepository, options);
    await seedUsers(this.userRepository, options);
    await seedTenants(this.tenantRepository, options);
    await seedTenantMemberships(
      this.tenantMembershipRepository,
      this.userRepository,
      this.tenantRepository,
      options,
    );
    await seedLogs(
      this.logRepository,
      this.userRepository,
      this.tenantRepository,
      options,
    );
    await seedApiKeys(
      this.apiKeyRepository,
      this.userRepository,
      this.tenantRepository,
      options,
    );
    await seedMfaRecoveryCodes(
      this.mfaRecoveryCodeRepository,
      this.userRepository,
      options,
    );
    await seedWebauthnCredentials(
      this.webauthnCredentialRepository,
      this.userRepository,
      options,
    );
    await seedUserDevices(
      this.userDeviceRepository,
      this.userRepository,
      options,
    );
    await seedTenantInvitations(
      this.invitationRepository,
      this.userRepository,
      this.tenantRepository,
      options,
    );
    this.logger.log('Database seeding completed');
  }
}
