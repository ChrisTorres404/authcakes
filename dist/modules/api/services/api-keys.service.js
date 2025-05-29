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
var ApiKeysService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeysService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const api_key_entity_1 = require("../entities/api-key.entity");
let ApiKeysService = ApiKeysService_1 = class ApiKeysService {
    apiKeysRepository;
    logger = new common_1.Logger(ApiKeysService_1.name);
    constructor(apiKeysRepository) {
        this.apiKeysRepository = apiKeysRepository;
    }
    async create(userId, tenantId, name, permissions = {}) {
        if (!tenantId) {
            this.logger.warn('tenantId is missing in create');
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        const key = this.generateApiKey();
        const apiKey = this.apiKeysRepository.create({
            userId,
            ...(tenantId ? { tenantId } : {}),
            name,
            key,
            permissions,
            active: true,
        });
        return this.apiKeysRepository.save(apiKey);
    }
    async findAll(userId, tenantId) {
        if (!tenantId) {
            this.logger.warn('tenantId is missing in findAll');
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        const query = { userId, tenantId };
        return this.apiKeysRepository.find({
            where: query,
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id, userId) {
        const apiKey = await this.apiKeysRepository.findOne({
            where: { id, userId },
        });
        if (!apiKey) {
            throw new common_1.NotFoundException('API key not found');
        }
        return apiKey;
    }
    async findByKey(key) {
        return this.apiKeysRepository.findOne({
            where: { key, active: true },
        });
    }
    async update(id, userId, updates) {
        const apiKey = await this.findOne(id, userId);
        if (updates.key) {
            throw new common_1.ForbiddenException('API key cannot be modified');
        }
        Object.assign(apiKey, updates);
        return this.apiKeysRepository.save(apiKey);
    }
    async revoke(id, userId) {
        const apiKey = await this.findOne(id, userId);
        apiKey.active = false;
        return this.apiKeysRepository.save(apiKey);
    }
    async delete(id, userId) {
        const apiKey = await this.findOne(id, userId);
        const deletedKey = { ...apiKey };
        await this.apiKeysRepository.remove(apiKey);
        return deletedKey;
    }
    generateApiKey() {
        const uuid = (0, uuid_1.v4)().replace(/-/g, '');
        return `ak_${uuid}`;
    }
    async validatePermissions(key, requiredPermissions) {
        const apiKey = await this.findByKey(key);
        if (!apiKey) {
            return false;
        }
        for (const permission of requiredPermissions) {
            if (!apiKey.permissions[permission]) {
                return false;
            }
        }
        return true;
    }
};
exports.ApiKeysService = ApiKeysService;
exports.ApiKeysService = ApiKeysService = ApiKeysService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(api_key_entity_1.ApiKey)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ApiKeysService);
//# sourceMappingURL=api-keys.service.js.map