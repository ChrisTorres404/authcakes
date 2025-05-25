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
const system_setting_entity_1 = require("../../settings/entities/system-setting.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const tenant_entity_1 = require("../../tenants/entities/tenant.entity");
const tenant_membership_entity_1 = require("../../tenants/entities/tenant-membership.entity");
const system_settings_seeder_1 = require("./system-settings.seeder");
const users_seeder_1 = require("./users.seeder");
const tenants_seeder_1 = require("./tenants.seeder");
const tenant_memberships_seeder_1 = require("./tenant-memberships.seeder");
const log_entity_1 = require("../../logs/entities/log.entity");
const api_key_entity_1 = require("../../api/entities/api-key.entity");
const mfa_recovery_code_entity_1 = require("../../auth/entities/mfa-recovery-code.entity");
const webauthn_credential_entity_1 = require("../../auth/entities/webauthn-credential.entity");
const user_device_entity_1 = require("../../auth/entities/user-device.entity");
const tenant_invitation_entity_1 = require("../../tenants/entities/tenant-invitation.entity");
const logs_seeder_1 = require("./logs.seeder");
const api_keys_seeder_1 = require("./api-keys.seeder");
const mfa_recovery_codes_seeder_1 = require("./mfa-recovery-codes.seeder");
const webauthn_credentials_seeder_1 = require("./webauthn-credentials.seeder");
const user_devices_seeder_1 = require("./user-devices.seeder");
const organization_invitations_seeder_1 = require("./organization-invitations.seeder");
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
    async seed() {
        await (0, system_settings_seeder_1.seedSystemSettings)(this.systemSettingsRepository);
        await (0, users_seeder_1.seedUsers)(this.userRepository);
        await (0, tenants_seeder_1.seedTenants)(this.tenantRepository);
        await (0, tenant_memberships_seeder_1.seedTenantMemberships)(this.tenantMembershipRepository, this.userRepository, this.tenantRepository);
        await (0, logs_seeder_1.seedLogs)(this.logRepository, this.userRepository, this.tenantRepository);
        await (0, api_keys_seeder_1.seedApiKeys)(this.apiKeyRepository, this.userRepository, this.tenantRepository);
        await (0, mfa_recovery_codes_seeder_1.seedMfaRecoveryCodes)(this.mfaRecoveryCodeRepository, this.userRepository);
        await (0, webauthn_credentials_seeder_1.seedWebauthnCredentials)(this.webauthnCredentialRepository, this.userRepository);
        await (0, user_devices_seeder_1.seedUserDevices)(this.userDeviceRepository, this.userRepository);
        await (0, organization_invitations_seeder_1.seedOrganizationInvitations)(this.invitationRepository, this.userRepository, this.tenantRepository);
        this.logger.log('Database seeding completed');
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