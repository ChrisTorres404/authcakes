// src/modules/database/seeds/seeder.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

export interface SeederOptions {
  force?: boolean;
  environment?: 'development' | 'test' | 'production';
}

import { SystemSetting } from '../../settings/entities/system-setting.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantMembership } from '../../tenants/entities/tenant-membership.entity';
import { Log } from '../../logs/entities/log.entity';
import { ApiKey } from '../../api/entities/api-key.entity';
import { MfaRecoveryCode } from '../../auth/entities/mfa-recovery-code.entity';
import { WebauthnCredential } from '../../auth/entities/webauthn-credential.entity';
import { UserDevice } from '../../auth/entities/user-device.entity';
import { TenantInvitation } from '../../tenants/entities/tenant-invitation.entity';
import { getSeedDataForEnvironment, SeedDataConfig } from './data';

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
    const environment = options.environment || process.env.NODE_ENV || 'development';
    this.logger.log(`Seeding database for ${environment} environment`);
    
    const seedData = getSeedDataForEnvironment(environment);
    
    // Always seed system settings
    await this.seedSystemSettings(seedData, options);
    
    // Seed users if any defined
    if (seedData.users.length > 0) {
      await this.seedUsers(seedData, options);
    }
    
    // Seed tenants if any defined
    if (seedData.tenants.length > 0) {
      await this.seedTenants(seedData, options);
    }
    
    // Seed memberships if any defined
    if (seedData.tenantMemberships.length > 0) {
      await this.seedTenantMemberships(seedData, options);
    }
    
    // Seed API keys if any defined
    if (seedData.apiKeys && seedData.apiKeys.length > 0) {
      await this.seedApiKeys(seedData, options);
    }
    
    // Seed demo data if requested
    if (seedData.includeDemoData) {
      await this.seedDemoData(seedData, options);
    }
    
    this.logger.log('Database seeding completed');
  }

  private async seedSystemSettings(seedData: SeedDataConfig, options: SeederOptions) {
    const existingSettings = await this.systemSettingsRepository.count();
    
    if (existingSettings > 0 && !options.force) {
      this.logger.log('System settings already exist, skipping seeding');
      return;
    }
    
    if (options.force) {
      await this.systemSettingsRepository.clear();
    }
    
    for (const setting of seedData.systemSettings) {
      const entity = this.systemSettingsRepository.create(setting);
      await this.systemSettingsRepository.save(entity);
    }
    
    this.logger.log(`Seeded ${seedData.systemSettings.length} system settings`);
  }

  private async seedUsers(seedData: SeedDataConfig, options: SeederOptions) {
    const existingUsers = await this.userRepository.count();
    
    if (existingUsers > 0 && !options.force) {
      this.logger.log('Users already exist, skipping seeding');
      return;
    }
    
    if (options.force) {
      await this.userRepository.clear();
    }
    
    for (const userData of seedData.users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
      });
      await this.userRepository.save(user);
    }
    
    this.logger.log(`Seeded ${seedData.users.length} users`);
  }

  private async seedTenants(seedData: SeedDataConfig, options: SeederOptions) {
    const existingTenants = await this.tenantRepository.count();
    
    if (existingTenants > 0 && !options.force) {
      this.logger.log('Tenants already exist, skipping seeding');
      return;
    }
    
    if (options.force) {
      await this.tenantRepository.clear();
    }
    
    for (const tenantData of seedData.tenants) {
      const tenant = this.tenantRepository.create(tenantData);
      await this.tenantRepository.save(tenant);
    }
    
    this.logger.log(`Seeded ${seedData.tenants.length} tenants`);
  }

  private async seedTenantMemberships(seedData: SeedDataConfig, options: SeederOptions) {
    const existingMemberships = await this.tenantMembershipRepository.count();
    
    if (existingMemberships > 0 && !options.force) {
      this.logger.log('Tenant memberships already exist, skipping seeding');
      return;
    }
    
    if (options.force) {
      await this.tenantMembershipRepository.clear();
    }
    
    for (const membershipData of seedData.tenantMemberships) {
      const user = await this.userRepository.findOne({
        where: { email: membershipData.userEmail },
      });
      
      const tenant = await this.tenantRepository.findOne({
        where: { slug: membershipData.tenantSlug },
      });
      
      if (user && tenant) {
        const membership = this.tenantMembershipRepository.create({
          user,
          tenant,
          role: membershipData.role,
        });
        await this.tenantMembershipRepository.save(membership);
      }
    }
    
    this.logger.log(`Seeded ${seedData.tenantMemberships.length} tenant memberships`);
  }

  private async seedApiKeys(seedData: SeedDataConfig, options: SeederOptions) {
    if (!seedData.apiKeys || seedData.apiKeys.length === 0) {
      return;
    }
    
    const existingKeys = await this.apiKeyRepository.count();
    
    if (existingKeys > 0 && !options.force) {
      this.logger.log('API keys already exist, skipping seeding');
      return;
    }
    
    if (options.force) {
      await this.apiKeyRepository.clear();
    }
    
    for (const keyData of seedData.apiKeys) {
      const user = await this.userRepository.findOne({
        where: { email: keyData.userEmail },
      });
      
      const tenant = keyData.tenantSlug
        ? await this.tenantRepository.findOne({
            where: { slug: keyData.tenantSlug },
          })
        : null;
      
      if (user) {
        const apiKey = this.apiKeyRepository.create({
          name: keyData.name,
          key: `demo_${Math.random().toString(36).substring(2, 15)}`,
          user,
          tenant: tenant || undefined,
          permissions: keyData.permissions,
          active: keyData.active,
        });
        await this.apiKeyRepository.save(apiKey);
      }
    }
    
    this.logger.log(`Seeded ${seedData.apiKeys.length} API keys`);
  }

  private async seedDemoData(seedData: SeedDataConfig, options: SeederOptions) {
    // Get admin user for demo data
    const adminUser = await this.userRepository.findOne({
      where: { email: 'admin@authcakes.com' },
    });
    
    if (!adminUser) {
      this.logger.warn('Admin user not found, skipping demo data');
      return;
    }
    
    // Seed MFA recovery codes
    const recoveryCodes = Array.from({ length: 10 }, () => ({
      user: adminUser,
      code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      used: false,
    }));
    
    for (const code of recoveryCodes) {
      const entity = this.mfaRecoveryCodeRepository.create(code);
      await this.mfaRecoveryCodeRepository.save(entity);
    }
    
    // Seed WebAuthn credential
    const webauthnCred = this.webauthnCredentialRepository.create({
      user: adminUser,
      credentialId: 'demo-credential-id',
      publicKey: 'demo-public-key',
      counter: 0,
      deviceName: 'Demo Security Key',
    });
    await this.webauthnCredentialRepository.save(webauthnCred);
    
    // Seed user device
    const device = this.userDeviceRepository.create({
      user: adminUser,
      deviceId: 'demo-device-id',
      deviceType: 'desktop',
      userAgent: 'Demo Browser',
      lastLogin: new Date(),
      trusted: true,
    });
    await this.userDeviceRepository.save(device);
    
    // Seed demo logs
    const tenant = await this.tenantRepository.findOne({
      where: { slug: 'acme-corp' },
    });
    
    if (tenant) {
      const log = this.logRepository.create({
        user: adminUser,
        tenant,
        action: 'user.login',
        ip: '127.0.0.1',
        userAgent: 'Demo Browser',
        details: { demo: true },
      });
      await this.logRepository.save(log);
    }
    
    this.logger.log('Seeded demo data successfully');
  }
}