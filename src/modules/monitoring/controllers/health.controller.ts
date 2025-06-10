import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { Public } from '../../../common/decorators/public.decorator';
import { MetricsService } from '../services/metrics.service';

@ApiTags('Health')
@Controller('health')
@Public()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private metrics: MetricsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
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

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  @HealthCheck()
  live() {
    this.metrics.increment('health.liveness');
    return this.health.check([]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe with dependency checks' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  @HealthCheck()
  async ready() {
    this.metrics.increment('health.readiness');
    
    const result = await this.health.check([
      // Database health
      () => this.db.pingCheck('database', { timeout: 3000 }),
      
      // Memory health (max 500MB heap)
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
      
      // Memory RSS (max 1GB)
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),
      
      // Disk health (min 10% free)
      () => this.disk.checkStorage('disk', { 
        path: '/',
        thresholdPercent: 0.9,
      }),
    ]);

    // Record health status
    if (result.status === 'ok') {
      this.metrics.gauge('health.status', 1);
    } else {
      this.metrics.gauge('health.status', 0);
      this.metrics.increment('health.unhealthy', { 
        details: JSON.stringify(result.details) 
      });
    }

    return result;
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Application metrics summary' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  async metrics() {
    // Return a summary of key metrics
    // In production, this would typically be scraped by Prometheus
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
}