"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransformResponseInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const api_response_dto_1 = require("../dto/api-response.dto");
const uuid_1 = require("uuid");
let TransformResponseInterceptor = class TransformResponseInterceptor {
    intercept(context, next) {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const startTime = Date.now();
        const requestId = request.headers['x-request-id'] || (0, uuid_1.v4)();
        request['id'] = requestId;
        response.setHeader('X-Request-Id', requestId);
        const version = request['apiVersion'] || 'v1';
        return next.handle().pipe((0, operators_1.tap)(() => {
            const responseTime = Date.now() - startTime;
            response.setHeader('X-Response-Time', `${responseTime}ms`);
        }), (0, operators_1.map)((data) => {
            if (data instanceof api_response_dto_1.ApiResponseDto) {
                return data;
            }
            const contentType = response.getHeader('Content-Type');
            if (typeof contentType === 'string' && contentType.includes('application/octet-stream')) {
                return data;
            }
            return api_response_dto_1.ApiResponseDto.success(data, {
                version,
                requestId,
                responseTime: Date.now() - startTime,
            });
        }), (0, operators_1.catchError)((error) => {
            const responseTime = Date.now() - startTime;
            if (error instanceof common_1.HttpException) {
                const status = error.getStatus();
                const errorResponse = error.getResponse();
                let errorData = {};
                if (typeof errorResponse === 'string') {
                    errorData = {
                        code: this.getErrorCode(status),
                        message: errorResponse,
                    };
                }
                else if (typeof errorResponse === 'object') {
                    errorData = {
                        code: errorResponse['error'] || this.getErrorCode(status),
                        message: errorResponse['message'] || error.message,
                        details: errorResponse['details'] || errorResponse['errors'],
                    };
                }
                const apiError = api_response_dto_1.ApiResponseDto.error(errorData.code, errorData.message, errorData.details, {
                    version,
                    requestId,
                    responseTime,
                });
                response.status(status);
                return (0, rxjs_1.throwError)(() => apiError);
            }
            const apiError = api_response_dto_1.ApiResponseDto.error('INTERNAL_SERVER_ERROR', process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : error.message || 'An unexpected error occurred', process.env.NODE_ENV === 'production' ? undefined : error.stack, {
                version,
                requestId,
                responseTime,
            });
            response.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            return (0, rxjs_1.throwError)(() => apiError);
        }));
    }
    getErrorCode(status) {
        const errorCodes = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'UNPROCESSABLE_ENTITY',
            429: 'TOO_MANY_REQUESTS',
            500: 'INTERNAL_SERVER_ERROR',
            502: 'BAD_GATEWAY',
            503: 'SERVICE_UNAVAILABLE',
            504: 'GATEWAY_TIMEOUT',
        };
        return errorCodes[status] || 'UNKNOWN_ERROR';
    }
};
exports.TransformResponseInterceptor = TransformResponseInterceptor;
exports.TransformResponseInterceptor = TransformResponseInterceptor = __decorate([
    (0, common_1.Injectable)()
], TransformResponseInterceptor);
//# sourceMappingURL=transform-response.interceptor.js.map