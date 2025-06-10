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
exports.RefreshTokenController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const refresh_token_service_1 = require("../services/refresh-token.service");
const create_refresh_token_dto_1 = require("../dto/create-refresh-token.dto");
const revoke_refresh_token_dto_1 = require("../dto/revoke-refresh-token.dto");
const refresh_token_entity_1 = require("../entities/refresh-token.entity");
let RefreshTokenController = class RefreshTokenController {
    refreshTokenService;
    constructor(refreshTokenService) {
        this.refreshTokenService = refreshTokenService;
    }
    async create(dto) {
        return this.refreshTokenService.createRefreshToken(dto);
    }
    async revoke(dto) {
        return this.refreshTokenService.revokeRefreshToken(dto);
    }
    async listUserTokens(userId) {
        return this.refreshTokenService.listUserRefreshTokens(userId);
    }
};
exports.RefreshTokenController = RefreshTokenController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new refresh token' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Refresh token created',
        type: refresh_token_entity_1.RefreshToken,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_refresh_token_dto_1.CreateRefreshTokenDto]),
    __metadata("design:returntype", Promise)
], RefreshTokenController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('revoke'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke a refresh token' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Refresh token revoked',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [revoke_refresh_token_dto_1.RevokeRefreshTokenDto]),
    __metadata("design:returntype", Promise)
], RefreshTokenController.prototype, "revoke", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'List all refresh tokens for a user' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of refresh tokens',
        type: [refresh_token_entity_1.RefreshToken],
    }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RefreshTokenController.prototype, "listUserTokens", null);
exports.RefreshTokenController = RefreshTokenController = __decorate([
    (0, swagger_1.ApiTags)('Refresh Tokens'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('v1/refresh-tokens'),
    __metadata("design:paramtypes", [refresh_token_service_1.RefreshTokenService])
], RefreshTokenController);
//# sourceMappingURL=refresh-token.controller.js.map