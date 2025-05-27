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
exports.TokenResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const login_response_dto_1 = require("./login-response.dto");
class TokenResponseDto {
    success;
    user;
    accessToken;
    refreshToken;
}
exports.TokenResponseDto = TokenResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], TokenResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: login_response_dto_1.LoginUserDto }),
    __metadata("design:type", login_response_dto_1.LoginUserDto)
], TokenResponseDto.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'access.jwt.token' }),
    __metadata("design:type", String)
], TokenResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'refresh.jwt.token' }),
    __metadata("design:type", String)
], TokenResponseDto.prototype, "refreshToken", void 0);
//# sourceMappingURL=token-response.dto.js.map