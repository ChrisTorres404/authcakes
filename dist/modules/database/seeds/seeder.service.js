"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SeederService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeederService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const system_setting_entity_1 = require("../../settings/entities/system-setting.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const tenant_entity_1 = require("../../tenants/entities/tenant.entity");
const tenant_membership_entity_1 = require("../../tenants/entities/tenant-membership.entity");
const log_entity_1 = require("../../logs/entities/log.entity");
const api_key_entity_1 = require("../../api/entities/api-key.entity");
const mfa_recovery_code_entity_1 = require("../../auth/entities/mfa-recovery-code.entity");
const webauthn_credential_entity_1 = require("../../auth/entities/webauthn-credential.entity");
const user_device_entity_1 = require("../../auth/entities/user-device.entity");
const tenant_invitation_entity_1 = require("../../tenants/entities/tenant-invitation.entity");
const data_1 = require("./data");
let SeederService = SeederService_1 = class SeederService {
    systemSettingsRepository;
    userRepository;
    tenantRepository;
    tenantMembershipRepository;
    logRepository;
    apiKeyRepository;
    mfaRecoveryCodeRepository;
    webauthnCredentialRepository;
    userDeviceRepository;
    invitationRepository;
    logger = new common_1.Logger(SeederService_1.name);
    constructor(systemSettingsRepository, userRepository, tenantRepository, tenantMembershipRepository, logRepository, apiKeyRepository, mfaRecoveryCodeRepository, webauthnCredentialRepository, userDeviceRepository, invitationRepository) {
        this.systemSettingsRepository = systemSettingsRepository;
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.tenantMembershipRepository = tenantMembershipRepository;
        this.logRepository = logRepository;
        this.apiKeyRepository = apiKeyRepository;
        this.mfaRecoveryCodeRepository = mfaRecoveryCodeRepository;
        this.webauthnCredentialRepository = webauthnCredentialRepository;
        this.userDeviceRepository = userDeviceRepository;
        this.invitationRepository = invitationRepository;
        common_1.Logger.log('SeederService constructed');
    }
    async seed(options = {}) {
        const environment = options.environment || process.env.NODE_ENV || 'development';
        this.logger.log(`Seeding database for ${environment} environment`);
        const seedData = (0, data_1.getSeedDataForEnvironment)(environment);
        await this.seedSystemSettings(seedData, options);
        if (seedData.users.length > 0) {
            await this.seedUsers(seedData, options);
        }
        if (seedData.tenants.length > 0) {
            await this.seedTenants(seedData, options);
        }
        if (seedData.tenantMemberships.length > 0) {
            await this.seedTenantMemberships(seedData, options);
        }
        if (seedData.apiKeys && seedData.apiKeys.length > 0) {
            await this.seedApiKeys(seedData, options);
        }
        if (seedData.includeDemoData) {
            await this.seedDemoData(seedData, options);
        }
        this.logger.log('Database seeding completed');
    }
    async seedSystemSettings(seedData, options) {
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
    async seedUsers(seedData, options) {
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
    async seedTenants(seedData, options) {
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
    async seedTenantMemberships(seedData, options) {
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
    async seedApiKeys(seedData, options) {
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
    async seedDemoData(seedData, options) {
        const adminUser = await this.userRepository.findOne({
            where: { email: 'admin@authcakes.com' },
        });
        if (!adminUser) {
            this.logger.warn('Admin user not found, skipping demo data');
            return;
        }
        const recoveryCodes = Array.from({ length: 10 }, () => ({
            user: adminUser,
            code: Math.random().toString(36).substring(2, 10).toUpperCase(),
            used: false,
        }));
        for (const code of recoveryCodes) {
            const entity = this.mfaRecoveryCodeRepository.create(code);
            await this.mfaRecoveryCodeRepository.save(entity);
        }
        const webauthnCred = this.webauthnCredentialRepository.create({
            user: adminUser,
            credentialId: 'demo-credential-id',
            publicKey: 'demo-public-key',
            counter: 0,
            deviceName: 'Demo Security Key',
        });
        await this.webauthnCredentialRepository.save(webauthnCred);
        const device = this.userDeviceRepository.create({
            user: adminUser,
            deviceId: 'demo-device-id',
            deviceType: 'desktop',
            userAgent: 'Demo Browser',
            lastLogin: new Date(),
            trusted: true,
        });
        await this.userDeviceRepository.save(device);
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
};
exports.SeederService = SeederService;
exports.SeederService = SeederService = SeederService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(system_setting_entity_1.SystemSetting)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __param(3, (0, typeorm_1.InjectRepository)(tenant_membership_entity_1.TenantMembership)),
    __param(4, (0, typeorm_1.InjectRepository)(log_entity_1.Log)),
    __param(5, (0, typeorm_1.InjectRepository)(api_key_entity_1.ApiKey)),
    __param(6, (0, typeorm_1.InjectRepository)(mfa_recovery_code_entity_1.MfaRecoveryCode)),
    __param(7, (0, typeorm_1.InjectRepository)(webauthn_credential_entity_1.WebauthnCredential)),
    __param(8, (0, typeorm_1.InjectRepository)(user_device_entity_1.UserDevice)),
    __param(9, (0, typeorm_1.InjectRepository)(tenant_invitation_entity_1.TenantInvitation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SeederService);
//# sourceMappingURL=seeder.service.js.map