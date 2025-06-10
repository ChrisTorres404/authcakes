import { Module, Global } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MetricsService } from './services/metrics.service';
import { HealthController } from './controllers/health.controller';

@Global()
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MonitoringModule {}