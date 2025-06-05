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
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const typeorm_1 = require("typeorm");
const class_transformer_1 = require("class-transformer");
const tenant_membership_entity_1 = require("../../tenants/entities/tenant-membership.entity");
const session_entity_1 = require("../../auth/entities/session.entity");
const refresh_token_entity_1 = require("../../auth/entities/refresh-token.entity");
const api_key_entity_1 = require("../../api/entities/api-key.entity");
const user_device_entity_1 = require("../../auth/entities/user-device.entity");
const mfa_recovery_code_entity_1 = require("../../auth/entities/mfa-recovery-code.entity");
const webauthn_credential_entity_1 = require("../../auth/entities/webauthn-credential.entity");
const password_history_entity_1 = require("../../auth/entities/password-history.entity");
const log_entity_1 = require("../../logs/entities/log.entity");
let User = class User {
    id;
    email;
    password;
    role;
    active;
    firstName;
    lastName;
    avatar;
    emailVerified;
    phoneNumber;
    phoneVerified;
    emailVerificationToken;
    phoneVerificationToken;
    resetToken;
    resetTokenExpiry;
    otp;
    otpExpiry;
    accountRecoveryToken;
    accountRecoveryTokenExpiry;
    failedLoginAttempts;
    lockedUntil;
    lastLogin;
    company;
    department;
    country;
    state;
    address;
    address2;
    city;
    zipCode;
    bio;
    mfaEnabled;
    mfaSecret;
    mfaType;
    tenantMemberships;
    sessions;
    refreshTokens;
    apiKeys;
    devices;
    mfaRecoveryCodes;
    webauthnCredentials;
    passwordHistory;
    logs;
    createdAt;
    updatedAt;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'user' }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "emailVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "phoneVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'varchar', length: 255, default: null }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", Object)
], User.prototype, "emailVerificationToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'varchar', length: 255, default: null }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", String)
], User.prototype, "phoneVerificationToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'varchar', length: 255, default: null }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", Object)
], User.prototype, "resetToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp', default: null }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", Object)
], User.prototype, "resetTokenExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'varchar', length: 10, default: null }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", Object)
], User.prototype, "otp", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp', default: null }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", Object)
], User.prototype, "otpExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'varchar', length: 255, default: null }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", Object)
], User.prototype, "accountRecoveryToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp', default: null }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", Object)
], User.prototype, "accountRecoveryTokenExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", Number)
], User.prototype, "failedLoginAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp', default: null }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", Object)
], User.prototype, "lockedUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp', default: null }),
    __metadata("design:type", Date)
], User.prototype, "lastLogin", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "address2", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "zipCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], User.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "mfaEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'varchar', length: 255, default: null }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", String)
], User.prototype, "mfaSecret", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "mfaType", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => tenant_membership_entity_1.TenantMembership, (membership) => membership.user),
    __metadata("design:type", Array)
], User.prototype, "tenantMemberships", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => session_entity_1.Session, (session) => session.user),
    __metadata("design:type", Array)
], User.prototype, "sessions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => refresh_token_entity_1.RefreshToken, (token) => token.user),
    __metadata("design:type", Array)
], User.prototype, "refreshTokens", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => api_key_entity_1.ApiKey, (apiKey) => apiKey.user),
    __metadata("design:type", Array)
], User.prototype, "apiKeys", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_device_entity_1.UserDevice, (device) => device.user),
    __metadata("design:type", Array)
], User.prototype, "devices", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => mfa_recovery_code_entity_1.MfaRecoveryCode, (code) => code.user),
    __metadata("design:type", Array)
], User.prototype, "mfaRecoveryCodes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => webauthn_credential_entity_1.WebauthnCredential, (credential) => credential.user),
    __metadata("design:type", Array)
], User.prototype, "webauthnCredentials", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => password_history_entity_1.PasswordHistory, (passwordHistory) => passwordHistory.user),
    __metadata("design:type", Array)
], User.prototype, "passwordHistory", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => log_entity_1.Log, (log) => log.user),
    __metadata("design:type", Array)
], User.prototype, "logs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map