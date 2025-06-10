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
exports.SystemAuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const system_token_dto_1 = require("../dto/system-token.dto");
const system_token_response_dto_1 = require("../dto/system-token-response.dto");
const crypto = require("crypto");
let SystemAuthController = class SystemAuthController {
    configService;
    jwtService;
    constructor(configService, jwtService) {
        this.configService = configService;
        this.jwtService = jwtService;
    }
    async generateSystemToken(dto) {
        const validApiKeys = this.configService.get('system.apiKeys', []);
        if (!validApiKeys.includes(dto.apiKey)) {
            throw new common_1.UnauthorizedException('Invalid API key');
        }
        const payload = {
            type: 'system',
            clientId: dto.clientId,
            apiKeyHash: this.hashApiKey(dto.apiKey),
            permissions: dto.permissions || ['read', 'write'],
        };
        const systemSecret = this.configService.get('system.jwtSecret');
        const expirationMinutes = this.configService.get('system.jwtExpirationMinutes', 1440);
        const token = await this.jwtService.signAsync(payload, {
            secret: systemSecret,
            expiresIn: `${expirationMinutes}m`,
            issuer: this.configService.get('system.jwtIssuer'),
            audience: this.configService.get('system.jwtAudience'),
        });
        return {
            success: true,
            token,
            expiresIn: expirationMinutes * 60,
            tokenType: 'Bearer',
            clientId: dto.clientId,
        };
    }
    async validateSystemToken(dto) {
        try {
            const systemSecret = this.configService.get('system.jwtSecret');
            const payload = await this.jwtService.verifyAsync(dto.token, {
                secret: systemSecret,
            });
            return {
                valid: true,
                clientId: payload.clientId,
                expiresAt: new Date(payload.exp * 1000),
            };
        }
        catch {
            return { valid: false };
        }
    }
    hashApiKey(apiKey) {
        return crypto
            .createHash('sha256')
            .update(apiKey)
            .digest('hex')
            .substring(0, 16);
    }
};
exports.SystemAuthController = SystemAuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate system JWT token',
        description: 'Exchange API key for a system JWT token for API authentication',
    }),
    (0, swagger_1.ApiBody)({ type: system_token_dto_1.SystemTokenDto }),
    (0, swagger_1.ApiOkResponse)({
        type: system_token_response_dto_1.SystemTokenResponseDto,
        description: 'System token generated successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [system_token_dto_1.SystemTokenDto]),
    __metadata("design:returntype", Promise)
], SystemAuthController.prototype, "generateSystemToken", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('validate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Validate system token',
        description: 'Verify if a system token is valid and not expired',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SystemAuthController.prototype, "validateSystemToken", null);
exports.SystemAuthController = SystemAuthController = __decorate([
    (0, swagger_1.ApiTags)('System Auth'),
    (0, common_1.Controller)('v1/system/auth'),
    __metadata("design:paramtypes", [config_1.ConfigService,
        jwt_1.JwtService])
], SystemAuthController);
//# sourceMappingURL=system-auth.controller.js.map