"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapWithSpan = exports.createSpan = exports.getTracer = exports.initializeMonitoring = void 0;
const tracer = require("dd-trace");
const common_1 = require("@nestjs/common");
const initializeMonitoring = () => {
    const logger = new common_1.Logger('Monitoring');
    if (process.env.NODE_ENV !== 'production' && !process.env.ENABLE_APM) {
        logger.log('APM monitoring disabled in non-production environment');
        return;
    }
    const config = {
        service: process.env.DD_SERVICE || 'authcakes-api',
        env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
        version: process.env.DD_VERSION || process.env.npm_package_version || '1.0.0',
        analytics: true,
        logInjection: true,
        profiling: process.env.NODE_ENV === 'production',
        runtimeMetrics: true,
        sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        tags: {
            'service.name': process.env.DD_SERVICE || 'authcakes-api',
            'service.version': process.env.DD_VERSION || process.env.npm_package_version || '1.0.0',
            'deployment.environment': process.env.DD_ENV || process.env.NODE_ENV || 'development',
        },
    };
    try {
        tracer.init(config);
        logger.log('DataDog APM initialized successfully', config);
    }
    catch (error) {
        logger.error('Failed to initialize DataDog APM', error);
    }
};
exports.initializeMonitoring = initializeMonitoring;
const getTracer = () => tracer;
exports.getTracer = getTracer;
const createSpan = (operation, options) => {
    return tracer.startSpan(operation, options);
};
exports.createSpan = createSpan;
const wrapWithSpan = async (operation, fn, tags) => {
    const span = (0, exports.createSpan)(operation);
    if (tags) {
        Object.entries(tags).forEach(([key, value]) => {
            span.setTag(key, value);
        });
    }
    try {
        const result = await fn();
        span.finish();
        return result;
    }
    catch (error) {
        span.setTag('error', true);
        span.setTag('error.message', error.message);
        span.setTag('error.stack', error.stack);
        span.finish();
        throw error;
    }
};
exports.wrapWithSpan = wrapWithSpan;
//# sourceMappingURL=monitoring.config.js.map