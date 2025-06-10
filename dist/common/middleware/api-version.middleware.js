"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiVersionMiddleware = void 0;
const common_1 = require("@nestjs/common");
let ApiVersionMiddleware = class ApiVersionMiddleware {
    use(req, res, next) {
        const fullPath = req.originalUrl || req.url;
        const pathSegments = fullPath.split('/').filter(segment => segment && !segment.includes('?'));
        const apiIndex = pathSegments.findIndex(segment => segment === 'api');
        let version = 'v1';
        if (apiIndex !== -1 && apiIndex + 1 < pathSegments.length) {
            const nextSegment = pathSegments[apiIndex + 1];
            if (/^v\d+$/.test(nextSegment)) {
                version = nextSegment;
            }
        }
        req['apiVersion'] = version;
        res.setHeader('X-API-Version', version);
        next();
    }
};
exports.ApiVersionMiddleware = ApiVersionMiddleware;
exports.ApiVersionMiddleware = ApiVersionMiddleware = __decorate([
    (0, common_1.Injectable)()
], ApiVersionMiddleware);
//# sourceMappingURL=api-version.middleware.js.map