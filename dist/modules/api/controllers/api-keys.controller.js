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
var ApiKeysController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeysController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_keys_service_1 = require("../services/api-keys.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const create_api_key_dto_1 = require("../dto/create-api-key.dto");
const update_api_key_dto_1 = require("../dto/update-api-key.dto");
const api_key_response_dto_1 = require("../dto/api-key-response.dto");
let ApiKeysController = ApiKeysController_1 = class ApiKeysController {
    apiKeysService;
    logger = new common_1.Logger(ApiKeysController_1.name);
    constructor(apiKeysService) {
        this.apiKeysService = apiKeysService;
    }
    async create(req, createApiKeyDto) {
        if (!req.user.tenantId) {
            this.logger.warn('tenantId is missing in request context');
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        return this.apiKeysService.create(req.user.id, req.user.tenantId, createApiKeyDto.name, createApiKeyDto.permissions);
    }
    async findAll(req) {
        if (!req.user.tenantId) {
            this.logger.warn('tenantId is missing in request context');
            throw new common_1.BadRequestException('Tenant ID is required');
        }
        const apiKeys = await this.apiKeysService.findAll(req.user.id, req.user.tenantId);
        return { apiKeys };
    }
    async findOne(id, req) {
        return this.apiKeysService.findOne(id, req.user.id);
    }
    async update(id, req, updateApiKeyDto) {
        return this.apiKeysService.update(id, req.user.id, updateApiKeyDto);
    }
    async remove(id, req) {
        return this.apiKeysService.revoke(id, req.user.id);
    }
    async revoke(id, req) {
        return this.apiKeysService.revoke(id, req.user.id);
    }
    async permanentDelete(id, req) {
        const apiKey = await this.apiKeysService.findOne(id, req.user.id);
        if (apiKey.userId !== req.user.id && req.user.role !== 'admin') {
            throw new common_1.ForbiddenException('You do not have permission to permanently delete this API key');
        }
        return this.apiKeysService.delete(id, req.user.id);
    }
};
exports.ApiKeysController = ApiKeysController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new API key' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: api_key_response_dto_1.ApiKeyResponseDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_api_key_dto_1.CreateApiKeyDto]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all API keys' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_key_response_dto_1.ApiKeyListResponseDto }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get an API key by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_key_response_dto_1.ApiKeyResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an API key' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_key_response_dto_1.ApiKeyResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_api_key_dto_1.UpdateApiKeyDto]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke an API key' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_key_response_dto_1.ApiKeyResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/revoke'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke an API key (alternative endpoint)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_key_response_dto_1.ApiKeyResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "revoke", null);
__decorate([
    (0, common_1.Delete)(':id/permanent'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Permanently delete an API key (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_key_response_dto_1.ApiKeyResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "permanentDelete", null);
exports.ApiKeysController = ApiKeysController = ApiKeysController_1 = __decorate([
    (0, swagger_1.ApiTags)('API Keys'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('v1/api-keys'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [api_keys_service_1.ApiKeysService])
], ApiKeysController);
//# sourceMappingURL=api-keys.controller.js.map