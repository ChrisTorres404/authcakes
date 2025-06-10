import * as tracer from 'dd-trace';
import { Logger } from '@nestjs/common';

export interface MonitoringConfig {
  service: string;
  env: string;
  version: string;
  analytics: boolean;
  logInjection: boolean;
  profiling: boolean;
  runtimeMetrics: boolean;
  sampleRate: number;
  tags: Record<string, string>;
}

export const initializeMonitoring = (): void => {
  const logger = new Logger('Monitoring');
  
  if (process.env.NODE_ENV !== 'production' && !process.env.ENABLE_APM) {
    logger.log('APM monitoring disabled in non-production environment');
    return;
  }

  const config: MonitoringConfig = {
    service: process.env.DD_SERVICE || 'authcakes-api',
    env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
    version: process.env.DD_VERSION || process.env.npm_package_version || '1.0.0',
    analytics: true,
    logInjection: true,
    profiling: process.env.NODE_ENV === 'production',
    runtimeMetrics: true,
    sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    tags: {
      'service.name': process.env.DD_SERVICE || 'authcakes-api',
      'service.version': process.env.DD_VERSION || process.env.npm_package_version || '1.0.0',
      'deployment.environment': process.env.DD_ENV || process.env.NODE_ENV || 'development',
    },
  };

  try {
    tracer.init(config);
    logger.log('DataDog APM initialized successfully', config);
  } catch (error) {
    logger.error('Failed to initialize DataDog APM', error);
  }
};

export const getTracer = () => tracer;

export const createSpan = (operation: string, options?: any) => {
  return tracer.startSpan(operation, options);
};

export const wrapWithSpan = async <T>(
  operation: string,
  fn: () => Promise<T>,
  tags?: Record<string, any>
): Promise<T> => {
  const span = createSpan(operation);
  
  if (tags) {
    Object.entries(tags).forEach(([key, value]) => {
      span.setTag(key, value);
    });
  }

  try {
    const result = await fn();
    span.finish();
    return result;
  } catch (error) {
    span.setTag('error', true);
    span.setTag('error.message', error.message);
    span.setTag('error.stack', error.stack);
    span.finish();
    throw error;
  }
};