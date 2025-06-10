import * as tracer from 'dd-trace';
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
export declare const initializeMonitoring: () => void;
export declare const getTracer: () => tracer.Tracer;
export declare const createSpan: (operation: string, options?: any) => tracer.Span;
export declare const wrapWithSpan: <T>(operation: string, fn: () => Promise<T>, tags?: Record<string, any>) => Promise<T>;
