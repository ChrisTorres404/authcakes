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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const log_entity_1 = require("../entities/log.entity");
let LogsService = class LogsService {
    logsRepository;
    constructor(logsRepository) {
        this.logsRepository = logsRepository;
    }
    async create(logData) {
        const log = this.logsRepository.create({
            ...logData,
            timestamp: new Date(),
        });
        return this.logsRepository.save(log);
    }
    async findAll(filters = {}, page = 1, limit = 20) {
        const query = {};
        if (filters.userId)
            query.userId = filters.userId;
        if (filters.tenantId)
            query.tenantId = filters.tenantId;
        if (filters.action)
            query.action = filters.action;
        return this.logsRepository.findAndCount({
            where: query,
            order: { timestamp: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['user', 'tenant'],
        });
    }
    async findUserLogs(userId, page = 1, limit = 20) {
        return this.findAll({ userId }, page, limit);
    }
    async findTenantLogs(tenantId, page = 1, limit = 20) {
        if (!tenantId) {
            console.warn('[LogsService] Warning: tenantId is missing in findTenantLogs');
        }
        return this.findAll({ tenantId }, page, limit);
    }
    async logAuthEvent(action, userId, details = {}, request) {
        await this.create({
            action,
            userId: userId ?? undefined,
            details,
            ip: request?.ip,
            userAgent: request?.headers?.['user-agent'],
        });
    }
    async logTenantEvent(action, userId, tenantId, details = {}, request) {
        if (!tenantId) {
            console.warn('[LogsService] Warning: tenantId is missing in logTenantEvent');
        }
        await this.create({
            action,
            userId: userId ?? undefined,
            tenantId,
            details,
            ip: request?.ip,
            userAgent: request?.headers?.['user-agent'],
        });
    }
    async logAdminAction(action, userId, details = {}, request) {
        await this.create({
            action: `admin:${action}`,
            userId: userId ?? undefined,
            details,
            ip: request?.ip,
            userAgent: request?.headers?.['user-agent'],
        });
    }
};
exports.LogsService = LogsService;
exports.LogsService = LogsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(log_entity_1.Log)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LogsService);
//# sourceMappingURL=logs.service.js.map