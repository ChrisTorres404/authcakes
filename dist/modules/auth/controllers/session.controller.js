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
exports.SessionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const session_service_1 = require("../services/session.service");
const create_session_dto_1 = require("../dto/create-session.dto");
const revoke_session_dto_1 = require("../dto/revoke-session.dto");
const session_entity_1 = require("../entities/session.entity");
let SessionController = class SessionController {
    sessionService;
    constructor(sessionService) {
        this.sessionService = sessionService;
    }
    async create(dto) {
        return this.sessionService.createSession(dto);
    }
    async revoke(dto) {
        return this.sessionService.revokeSession(dto);
    }
    async listActive(userId) {
        return this.sessionService.listActiveSessions(userId);
    }
};
exports.SessionController = SessionController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new session' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Session created', type: session_entity_1.Session }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_session_dto_1.CreateSessionDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('revoke'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke a session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session revoked' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [revoke_session_dto_1.RevokeSessionDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "revoke", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'List active sessions for a user' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of active sessions',
        type: [session_entity_1.Session],
    }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "listActive", null);
exports.SessionController = SessionController = __decorate([
    (0, swagger_1.ApiTags)('Sessions'),
    (0, common_1.Controller)('sessions'),
    __metadata("design:paramtypes", [session_service_1.SessionService])
], SessionController);
//# sourceMappingURL=session.controller.js.map