"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenRepository = void 0;
const typeorm_1 = require("typeorm");
const refresh_token_entity_1 = require("../entities/refresh-token.entity");
let RefreshTokenRepository = class RefreshTokenRepository extends typeorm_1.Repository {
    async findValidToken(token) {
        const result = await this.findOne({
            where: {
                token,
                isRevoked: false,
                expiresAt: (0, typeorm_1.MoreThan)(new Date()),
            },
        });
        return result ?? undefined;
    }
    async revokeTokensByUser(userId) {
        await this.update({ user: { id: userId }, isRevoked: false }, { isRevoked: true, revokedAt: new Date() });
    }
    async cleanupExpiredTokens() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        await this.createQueryBuilder()
            .delete()
            .where('isRevoked = :isRevoked', { isRevoked: true })
            .andWhere('revokedAt < :date', { date: thirtyDaysAgo })
            .execute();
    }
};
exports.RefreshTokenRepository = RefreshTokenRepository;
exports.RefreshTokenRepository = RefreshTokenRepository = __decorate([
    (0, typeorm_1.EntityRepository)(refresh_token_entity_1.RefreshToken)
], RefreshTokenRepository);
//# sourceMappingURL=refresh-token.repository.js.map