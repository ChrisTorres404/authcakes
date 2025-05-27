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
exports.SessionListResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SessionDto {
    id;
    createdAt;
    deviceInfo;
    lastUsedAt;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-session' }),
    __metadata("design:type", String)
], SessionDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-06-01T12:00:00Z' }),
    __metadata("design:type", String)
], SessionDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: { ip: '127.0.0.1', userAgent: 'Mozilla/5.0' } }),
    __metadata("design:type", Object)
], SessionDto.prototype, "deviceInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-06-01T12:30:00Z' }),
    __metadata("design:type", String)
], SessionDto.prototype, "lastUsedAt", void 0);
class SessionListResponseDto {
    sessions;
}
exports.SessionListResponseDto = SessionListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SessionDto] }),
    __metadata("design:type", Array)
], SessionListResponseDto.prototype, "sessions", void 0);
//# sourceMappingURL=session-list-response.dto.js.map