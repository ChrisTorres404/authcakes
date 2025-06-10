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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const throttler_1 = require("@nestjs/throttler");
const public_decorator_1 = require("./common/decorators/public.decorator");
const swagger_generic_response_decorator_1 = require("./common/decorators/swagger-generic-response.decorator");
const api_info_dto_1 = require("./dto/api-info.dto");
const health_check_dto_1 = require("./dto/health-check.dto");
const api_response_dto_1 = require("./modules/tenants/dto/api-response.dto");
const system_auth_decorator_1 = require("./common/decorators/system-auth.decorator");
const swagger_1 = require("@nestjs/swagger");
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    getHello() {
        return this.appService.getHello();
    }
    healthCheck() {
        return {
            success: true,
            data: {
                status: 'ok',
                timestamp: new Date().toISOString(),
            },
        };
    }
    getApiInfo() {
        return {
            success: true,
            data: {
                name: 'AuthCakes API',
                version: '1.0.0',
                status: 'ok',
                timestamp: new Date().toISOString(),
            },
        };
    }
    testSystemAuth(req) {
        return {
            success: true,
            message: 'System authentication successful',
            system: req.system,
            timestamp: new Date().toISOString(),
        };
    }
    testSystemAndUserAuth(req) {
        return {
            success: true,
            message: 'System and user authentication successful',
            system: req.system,
            user: {
                id: req.user?.id,
                email: req.user?.email,
                role: req.user?.role,
            },
            timestamp: new Date().toISOString(),
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('health'),
    (0, swagger_generic_response_decorator_1.ApiResponseWithData)(health_check_dto_1.HealthCheckDto),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", api_response_dto_1.ApiResponseDto)
], AppController.prototype, "healthCheck", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('api'),
    (0, swagger_generic_response_decorator_1.ApiResponseWithData)(api_info_dto_1.ApiInfoDto),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", api_response_dto_1.ApiResponseDto)
], AppController.prototype, "getApiInfo", null);
__decorate([
    (0, system_auth_decorator_1.SystemAuth)(),
    (0, common_1.Get)('test/system-auth'),
    (0, swagger_1.ApiTags)('System Auth Test'),
    (0, swagger_1.ApiOperation)({
        summary: 'Test system authentication',
        description: 'Requires system API key or JWT. Use X-System-API-Key header or X-System-Authorization header.'
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AppController.prototype, "testSystemAuth", null);
__decorate([
    (0, system_auth_decorator_1.SystemAndUserAuth)(),
    (0, common_1.Get)('test/system-and-user-auth'),
    (0, swagger_1.ApiTags)('System Auth Test'),
    (0, swagger_1.ApiOperation)({
        summary: 'Test system and user authentication',
        description: 'Requires both system authentication (API key or JWT) and user JWT token.'
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AppController.prototype, "testSystemAndUserAuth", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map