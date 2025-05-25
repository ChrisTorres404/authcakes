"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const system_setting_entity_1 = require("../settings/entities/system-setting.entity");
const user_entity_1 = require("../users/entities/user.entity");
const tenant_entity_1 = require("../tenants/entities/tenant.entity");
const tenant_membership_entity_1 = require("../tenants/entities/tenant-membership.entity");
const seeder_service_1 = require("./seeds/seeder.service");
const log_entity_1 = require("../logs/entities/log.entity");
const api_key_entity_1 = require("../api/entities/api-key.entity");
const mfa_recovery_code_entity_1 = require("../auth/entities/mfa-recovery-code.entity");
const webauthn_credential_entity_1 = require("../auth/entities/webauthn-credential.entity");
const user_device_entity_1 = require("../auth/entities/user-device.entity");
const tenant_invitation_entity_1 = require("../tenants/entities/tenant-invitation.entity");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                system_setting_entity_1.SystemSetting,
                user_entity_1.User,
                tenant_entity_1.Tenant,
                tenant_membership_entity_1.TenantMembership,
                log_entity_1.Log,
                api_key_entity_1.ApiKey,
                mfa_recovery_code_entity_1.MfaRecoveryCode,
                webauthn_credential_entity_1.WebauthnCredential,
                user_device_entity_1.UserDevice,
                tenant_invitation_entity_1.TenantInvitation,
            ]),
        ],
        providers: [seeder_service_1.SeederService],
        exports: [seeder_service_1.SeederService],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map