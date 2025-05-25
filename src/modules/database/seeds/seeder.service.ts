// src/modules/database/seeds/seeder.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
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
import { seedOrganizationInvitations } from './organization-invitations.seeder';

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

  async seed() {
    await seedSystemSettings(this.systemSettingsRepository);
    await seedUsers(this.userRepository);
    await seedTenants(this.tenantRepository);
    await seedTenantMemberships(
      this.tenantMembershipRepository,
      this.userRepository,
      this.tenantRepository,
    );
    await seedLogs(
      this.logRepository,
      this.userRepository,
      this.tenantRepository,
    );
    await seedApiKeys(
      this.apiKeyRepository,
      this.userRepository,
      this.tenantRepository,
    );
    await seedMfaRecoveryCodes(
      this.mfaRecoveryCodeRepository,
      this.userRepository,
    );
    await seedWebauthnCredentials(
      this.webauthnCredentialRepository,
      this.userRepository,
    );
    await seedUserDevices(
      this.userDeviceRepository,
      this.userRepository,
    );
    await seedOrganizationInvitations(
      this.invitationRepository,
      this.userRepository,
      this.tenantRepository,
    );
    this.logger.log('Database seeding completed');
  }
}