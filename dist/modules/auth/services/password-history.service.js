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
var PasswordHistoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordHistoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const password_history_entity_1 = require("../entities/password-history.entity");
const bcrypt = require("bcryptjs");
let PasswordHistoryService = PasswordHistoryService_1 = class PasswordHistoryService {
    passwordHistoryRepository;
    logger = new common_1.Logger(PasswordHistoryService_1.name);
    constructor(passwordHistoryRepository) {
        this.passwordHistoryRepository = passwordHistoryRepository;
    }
    async addToHistory(userId, passwordHash) {
        this.logger.debug(`Adding password to history for user ${userId}`);
        await this.passwordHistoryRepository.save({
            userId,
            passwordHash,
            createdAt: new Date(),
        });
    }
    async isPasswordInHistory(userId, newPassword, historyCount = 5) {
        this.logger.debug(`Checking if password exists in history for user ${userId}`);
        const passwordHistory = await this.passwordHistoryRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: historyCount,
        });
        if (!passwordHistory.length) {
            return false;
        }
        for (const entry of passwordHistory) {
            const isMatch = await bcrypt.compare(newPassword, entry.passwordHash);
            if (isMatch) {
                this.logger.debug(`Password exists in history for user ${userId}`);
                return true;
            }
        }
        return false;
    }
    async pruneHistory(userId, keepCount) {
        this.logger.debug(`Pruning password history for user ${userId}, keeping ${keepCount}`);
        const entries = await this.passwordHistoryRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip: keepCount,
            take: 1,
        });
        if (entries.length === 0) {
            return;
        }
        const cutoffDate = entries[0].createdAt;
        await this.passwordHistoryRepository.delete({
            userId,
            createdAt: (0, typeorm_2.LessThan)(cutoffDate),
        });
    }
};
exports.PasswordHistoryService = PasswordHistoryService;
exports.PasswordHistoryService = PasswordHistoryService = PasswordHistoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(password_history_entity_1.PasswordHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PasswordHistoryService);
//# sourceMappingURL=password-history.service.js.map