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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSetting = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
let SystemSetting = class SystemSetting {
    key;
    value;
    type;
    description;
    createdAt;
    updatedAt;
};
exports.SystemSetting = SystemSetting;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'siteName' }),
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], SystemSetting.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'My App' }),
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], SystemSetting.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'string', default: 'string' }),
    (0, typeorm_1.Column)({ default: 'string' }),
    __metadata("design:type", String)
], SystemSetting.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'The name of the site', required: false }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SystemSetting.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'date-time',
        example: '2024-06-01T12:00:00Z',
    }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SystemSetting.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'date-time',
        example: '2024-06-01T12:00:00Z',
    }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SystemSetting.prototype, "updatedAt", void 0);
exports.SystemSetting = SystemSetting = __decorate([
    (0, typeorm_1.Entity)('system_settings')
], SystemSetting);
//# sourceMappingURL=system-setting.entity.js.map