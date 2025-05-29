"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRepository = void 0;
const typeorm_1 = require("typeorm");
const session_entity_1 = require("../entities/session.entity");
let SessionRepository = class SessionRepository extends typeorm_1.Repository {
    async findActiveSessionsByUser(userId) {
        return this.find({
            where: {
                user: { id: userId },
                isActive: true,
                revoked: false,
                expiresAt: (0, typeorm_1.MoreThan)(new Date()),
            },
        });
    }
};
exports.SessionRepository = SessionRepository;
exports.SessionRepository = SessionRepository = __decorate([
    (0, typeorm_1.EntityRepository)(session_entity_1.Session)
], SessionRepository);
//# sourceMappingURL=session.repository.js.map