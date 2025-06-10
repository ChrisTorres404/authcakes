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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const terminus_1 = require("@nestjs/terminus");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const metrics_service_1 = require("../services/metrics.service");
let HealthController = class HealthController {
    health;
    db;
    memory;
    disk;
    metrics;
    constructor(health, db, memory, disk, metrics) {
        this.health = health;
        this.db = db;
        this.memory = memory;
        this.disk = disk;
        this.metrics = metrics;
    }
    check() {
        this.metrics.increment('health.check');
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'authcakes-api',
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        };
    }
    live() {
        this.metrics.increment('health.liveness');
        return this.health.check([]);
    }
    async ready() {
        this.metrics.increment('health.readiness');
        const result = await this.health.check([
            () => this.db.pingCheck('database', { timeout: 3000 }),
            () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),
            () => this.disk.checkStorage('disk', {
                path: '/',
                thresholdPercent: 0.9,
            }),
        ]);
        if (result.status === 'ok') {
            this.metrics.gauge('health.status', 1);
        }
        else {
            this.metrics.gauge('health.status', 0);
            this.metrics.increment('health.unhealthy', {
                details: JSON.stringify(result.details)
            });
        }
        return result;
    }
    async metrics() {
        return {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                heapUsed: process.memoryUsage().heapUsed,
                heapTotal: process.memoryUsage().heapTotal,
                rss: process.memoryUsage().rss,
                external: process.memoryUsage().external,
            },
            cpu: process.cpuUsage(),
            pid: process.pid,
            version: {
                node: process.version,
                service: process.env.npm_package_version || '1.0.0',
            },
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Basic health check' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is healthy' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('live'),
    (0, swagger_1.ApiOperation)({ summary: 'Liveness probe for Kubernetes' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is alive' }),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "live", null);
__decorate([
    (0, common_1.Get)('ready'),
    (0, swagger_1.ApiOperation)({ summary: 'Readiness probe with dependency checks' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is ready' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'Service is not ready' }),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "ready", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Application metrics summary' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Metrics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "metrics", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)('health'),
    (0, public_decorator_1.Public)(),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.TypeOrmHealthIndicator,
        terminus_1.MemoryHealthIndicator,
        terminus_1.DiskHealthIndicator,
        metrics_service_1.MetricsService])
], HealthController);
//# sourceMappingURL=health.controller.js.map