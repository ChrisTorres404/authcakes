"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const api_key_entity_1 = require("./entities/api-key.entity");
const api_keys_service_1 = require("./services/api-keys.service");
const api_keys_controller_1 = require("./controllers/api-keys.controller");
let ApiModule = class ApiModule {
};
exports.ApiModule = ApiModule;
exports.ApiModule = ApiModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([api_key_entity_1.ApiKey])],
        controllers: [api_keys_controller_1.ApiKeysController],
        providers: [api_keys_service_1.ApiKeysService],
        exports: [api_keys_service_1.ApiKeysService],
    })
], ApiModule);
//# sourceMappingURL=api.module.js.map