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
var SessionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const session_entity_1 = require("../entities/session.entity");
const settings_service_1 = require("../../settings/services/settings.service");
const session_repository_1 = require("../repositories/session.repository");
let SessionService = SessionService_1 = class SessionService {
    sessionRepository;
    configService;
    settingsService;
    logger = new common_1.Logger(SessionService_1.name);
    constructor(sessionRepository, configService, settingsService) {
        this.sessionRepository = sessionRepository;
        this.configService = configService;
        this.settingsService = settingsService;
    }
    async createSession(dto) {
        const session = this.sessionRepository.create({
            user: { id: dto.userId },
            ipAddress: dto.ipAddress,
            userAgent: dto.userAgent,
            deviceInfo: dto.deviceInfo,
            isActive: true,
            revoked: false,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });
        const saved = await this.sessionRepository.save(session);
        this.logger.log(`Created session: ${saved.id} for user: ${dto.userId}`);
        return saved;
    }
    async getSessionById(sessionId) {
        return this.sessionRepository.findOne({
            where: { id: sessionId },
        });
    }
    async isSessionValid(userId, sessionId) {
        const session = await this.sessionRepository.findOne({
            where: {
                id: sessionId,
                user: { id: userId },
                revoked: false,
            },
        });
        if (!session) {
            return false;
        }
        const timeoutMinutes = await this.settingsService.getValue('global_session_timeout_minutes', 30);
        const lastUsedAt = session.lastUsedAt || session.createdAt;
        const timeoutMs = timeoutMinutes * 60 * 1000;
        if (Date.now() - lastUsedAt.getTime() > timeoutMs) {
            await this.revokeSession({ sessionId, revokedBy: null });
            return false;
        }
        return true;
    }
    async updateSessionActivity(sessionId) {
        await this.sessionRepository.update({ id: sessionId }, { lastUsedAt: new Date() });
    }
    async getSessionRemainingTime(sessionId) {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId },
        });
        if (!session) {
            return 0;
        }
        const timeoutMinutes = await this.settingsService.getValue('global_session_timeout_minutes', 30);
        const lastUsedAt = session.lastUsedAt || session.createdAt;
        const timeoutMs = timeoutMinutes * 60 * 1000;
        const elapsedMs = Date.now() - lastUsedAt.getTime();
        const remainingSeconds = Math.max(0, (timeoutMs - elapsedMs) / 1000);
        return Math.floor(remainingSeconds);
    }
    async getActiveSessions(userId) {
        return this.sessionRepository.find({
            where: {
                user: { id: userId },
                revoked: false,
            },
            order: {
                lastUsedAt: 'DESC',
            },
        });
    }
    async revokeSession(dto) {
        await this.sessionRepository.update({ id: dto.sessionId }, {
            revoked: true,
            revokedAt: new Date(),
            revokedBy: dto.revokedBy ?? '',
            isActive: false,
        });
    }
    async revokeAllUserSessions(userId, exceptSessionId) {
        const query = this.sessionRepository
            .createQueryBuilder()
            .update(session_entity_1.Session)
            .set({
            revoked: true,
            revokedAt: new Date(),
            revokedBy: '',
            isActive: false,
        })
            .where('userId = :userId', { userId })
            .andWhere('revoked = :revoked', { revoked: false });
        if (exceptSessionId) {
            query.andWhere('id != :exceptSessionId', { exceptSessionId });
        }
        const result = await query.execute();
        this.logger.log(`[revokeAllUserSessions] userId=${userId}, exceptSessionId=${exceptSessionId}, sessionsUpdated=${result.affected}`);
    }
    async checkCustomSessionPolicy(userId, deviceInfo) {
    }
    logAuditEvent(event) {
    }
    async listActiveSessions(userId) {
        return this.sessionRepository.findActiveSessionsByUser(userId);
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = SessionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __metadata("design:paramtypes", [session_repository_1.SessionRepository,
        config_1.ConfigService,
        settings_service_1.SettingsService])
], SessionService);
//# sourceMappingURL=session.service.js.map