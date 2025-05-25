"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_controller_1 = require("./controllers/auth.controller");
const auth_service_1 = require("./services/auth.service");
const token_service_1 = require("./services/token.service");
const session_service_1 = require("./services/session.service");
const audit_log_service_1 = require("./services/audit-log.service");
const notification_service_1 = require("./services/notification.service");
const password_history_service_1 = require("./services/password-history.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const local_strategy_1 = require("./strategies/local.strategy");
const jwt_refresh_strategy_1 = require("./strategies/jwt-refresh.strategy");
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
const session_entity_1 = require("./entities/session.entity");
const user_device_entity_1 = require("./entities/user-device.entity");
const mfa_recovery_code_entity_1 = require("./entities/mfa-recovery-code.entity");
const webauthn_credential_entity_1 = require("./entities/webauthn-credential.entity");
const password_history_entity_1 = require("./entities/password-history.entity");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const jwt_refresh_guard_1 = require("./guards/jwt-refresh.guard");
const local_auth_guard_1 = require("./guards/local-auth.guard");
const users_module_1 = require("../users/users.module");
const tenants_module_1 = require("../tenants/tenants.module");
const settings_module_1 = require("../settings/settings.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get('auth.jwt.secret'),
                    signOptions: {
                        expiresIn: configService.get('auth.jwt.accessExpiresIn'),
                    },
                }),
            }),
            typeorm_1.TypeOrmModule.forFeature([
                refresh_token_entity_1.RefreshToken,
                session_entity_1.Session,
                user_device_entity_1.UserDevice,
                mfa_recovery_code_entity_1.MfaRecoveryCode,
                webauthn_credential_entity_1.WebauthnCredential,
                password_history_entity_1.PasswordHistory,
            ]),
            users_module_1.UsersModule,
            tenants_module_1.TenantsModule,
            settings_module_1.SettingsModule,
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            token_service_1.TokenService,
            session_service_1.SessionService,
            jwt_strategy_1.JwtStrategy,
            local_strategy_1.LocalStrategy,
            jwt_refresh_strategy_1.JwtRefreshStrategy,
            jwt_auth_guard_1.JwtAuthGuard,
            jwt_refresh_guard_1.JwtRefreshGuard,
            local_auth_guard_1.LocalAuthGuard,
            audit_log_service_1.AuditLogService,
            notification_service_1.NotificationService,
            password_history_service_1.PasswordHistoryService,
        ],
        exports: [
            auth_service_1.AuthService,
            token_service_1.TokenService,
            session_service_1.SessionService,
            jwt_auth_guard_1.JwtAuthGuard,
            jwt_refresh_guard_1.JwtRefreshGuard,
            audit_log_service_1.AuditLogService,
            notification_service_1.NotificationService,
            password_history_service_1.PasswordHistoryService,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map