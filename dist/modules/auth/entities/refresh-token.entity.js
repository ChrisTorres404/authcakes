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
exports.RefreshToken = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const session_entity_1 = require("./session.entity");
let RefreshToken = class RefreshToken {
    id;
    user;
    session;
    token;
    expiresAt;
    isRevoked;
    revokedAt;
    revokedBy;
    replacedByToken;
    revocationReason;
    userAgent;
    ipAddress;
    createdAt;
    updatedAt;
};
exports.RefreshToken = RefreshToken;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RefreshToken.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.refreshTokens, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", user_entity_1.User)
], RefreshToken.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => session_entity_1.Session, (session) => session.refreshTokens, {
        onDelete: 'SET NULL',
        nullable: true,
    }),
    __metadata("design:type", session_entity_1.Session)
], RefreshToken.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', unique: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], RefreshToken.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], RefreshToken.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], RefreshToken.prototype, "isRevoked", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], RefreshToken.prototype, "revokedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 128 }),
    __metadata("design:type", String)
], RefreshToken.prototype, "revokedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], RefreshToken.prototype, "replacedByToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 256 }),
    __metadata("design:type", String)
], RefreshToken.prototype, "revocationReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 256 }),
    __metadata("design:type", String)
], RefreshToken.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 64 }),
    __metadata("design:type", String)
], RefreshToken.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RefreshToken.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RefreshToken.prototype, "updatedAt", void 0);
exports.RefreshToken = RefreshToken = __decorate([
    (0, typeorm_1.Entity)('refresh_tokens'),
    (0, typeorm_1.Unique)(['token']),
    (0, typeorm_1.Check)('"expiresAt" > "createdAt"'),
    (0, typeorm_1.Check)('("isRevoked" = false) OR ("isRevoked" = true AND "revokedAt" IS NOT NULL)')
], RefreshToken);
//# sourceMappingURL=refresh-token.entity.js.map