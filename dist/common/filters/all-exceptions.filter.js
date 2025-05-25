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
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    httpAdapterHost;
    logger = new common_1.Logger(AllExceptionsFilter_1.name);
    constructor(httpAdapterHost) {
        this.httpAdapterHost = httpAdapterHost;
    }
    catch(exception, host) {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const isProd = process.env.NODE_ENV === 'production';
        let status = 500;
        let message = 'Internal server error';
        let error = 'InternalServerError';
        let details = undefined;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'string') {
                message = res;
                error = exception.name;
            }
            else if (typeof res === 'object' && res !== null) {
                const obj = res;
                message = obj.message || exception.message || message;
                error = obj.error || exception.name;
                if (obj.details)
                    details = obj.details;
            }
            if (exception instanceof common_1.BadRequestException &&
                Array.isArray(exception.getResponse()?.message)) {
                error = 'ValidationError';
                message = exception.getResponse().message;
            }
            if (exception instanceof common_1.UnauthorizedException) {
                error = 'Unauthorized';
                message = 'Authentication required';
            }
            if (exception instanceof common_1.ForbiddenException) {
                error = 'Forbidden';
                message = 'You do not have permission to access this resource';
            }
        }
        else if (exception?.name === 'ValidationError') {
            status = 400;
            error = 'ValidationError';
            message = exception.message || 'Validation failed';
            details = exception.details;
        }
        else if (exception instanceof Error) {
            message = exception.message;
            error = exception.name;
        }
        if (status >= 500) {
            this.logger.error(`[${request.method}] ${request.url} ${status} - ${message}`, exception instanceof Error ? exception.stack : undefined);
        }
        else {
            this.logger.warn(`[${request.method}] ${request.url} ${status} - ${message}`);
        }
        const responseBody = {
            statusCode: status,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
        };
        if (process.env.NODE_ENV === 'development' && exception instanceof Error && exception.stack) {
            responseBody.stack = exception.stack;
        }
        if (process.env.NODE_ENV === 'development' && details) {
            responseBody.details = details;
        }
        httpAdapter.reply(response, responseBody, status);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [core_1.HttpAdapterHost])
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map