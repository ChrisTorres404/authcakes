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
exports.PaginatedApiResponseDto = exports.PaginationMetadataDto = exports.ApiResponseDto = exports.ApiMetadataDto = exports.ApiErrorDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const uuid_1 = require("uuid");
class ApiErrorDto {
    code;
    message;
    details;
}
exports.ApiErrorDto = ApiErrorDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error code for client-side handling',
        example: 'VALIDATION_ERROR',
    }),
    __metadata("design:type", String)
], ApiErrorDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Human-readable error message',
        example: 'Validation failed',
    }),
    __metadata("design:type", String)
], ApiErrorDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional error details',
        required: false,
        example: [{ field: 'email', constraints: { isEmail: 'email must be an email' } }],
    }),
    __metadata("design:type", Object)
], ApiErrorDto.prototype, "details", void 0);
class ApiMetadataDto {
    timestamp;
    version;
    requestId;
    responseTime;
}
exports.ApiMetadataDto = ApiMetadataDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response timestamp',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], ApiMetadataDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API version',
        example: 'v1',
    }),
    __metadata("design:type", String)
], ApiMetadataDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique request identifier for tracing',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], ApiMetadataDto.prototype, "requestId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response time in milliseconds',
        example: 45,
        required: false,
    }),
    __metadata("design:type", Number)
], ApiMetadataDto.prototype, "responseTime", void 0);
class ApiResponseDto {
    success;
    data;
    error;
    metadata;
    constructor(partial) {
        Object.assign(this, partial);
        if (!this.metadata) {
            this.metadata = {
                timestamp: new Date(),
                version: 'v1',
                requestId: (0, uuid_1.v4)(),
            };
        }
    }
    static success(data, metadata) {
        return new ApiResponseDto({
            success: true,
            data,
            metadata: {
                timestamp: new Date(),
                version: metadata?.version || 'v1',
                requestId: metadata?.requestId || (0, uuid_1.v4)(),
                responseTime: metadata?.responseTime,
            },
        });
    }
    static error(code, message, details, metadata) {
        return new ApiResponseDto({
            success: false,
            error: {
                code,
                message,
                details,
            },
            metadata: {
                timestamp: new Date(),
                version: metadata?.version || 'v1',
                requestId: metadata?.requestId || (0, uuid_1.v4)(),
                responseTime: metadata?.responseTime,
            },
        });
    }
}
exports.ApiResponseDto = ApiResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indicates if the request was successful',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ApiResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response data',
        required: false,
    }),
    __metadata("design:type", Object)
], ApiResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error information if request failed',
        type: ApiErrorDto,
        required: false,
    }),
    __metadata("design:type", ApiErrorDto)
], ApiResponseDto.prototype, "error", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response metadata',
        type: ApiMetadataDto,
    }),
    __metadata("design:type", ApiMetadataDto)
], ApiResponseDto.prototype, "metadata", void 0);
class PaginationMetadataDto {
    page;
    limit;
    total;
    totalPages;
    hasNext;
    hasPrevious;
}
exports.PaginationMetadataDto = PaginationMetadataDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Current page number',
        example: 1,
    }),
    __metadata("design:type", Number)
], PaginationMetadataDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of items per page',
        example: 20,
    }),
    __metadata("design:type", Number)
], PaginationMetadataDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of items',
        example: 100,
    }),
    __metadata("design:type", Number)
], PaginationMetadataDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of pages',
        example: 5,
    }),
    __metadata("design:type", Number)
], PaginationMetadataDto.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indicates if there is a next page',
        example: true,
    }),
    __metadata("design:type", Boolean)
], PaginationMetadataDto.prototype, "hasNext", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indicates if there is a previous page',
        example: false,
    }),
    __metadata("design:type", Boolean)
], PaginationMetadataDto.prototype, "hasPrevious", void 0);
class PaginatedApiResponseDto extends ApiResponseDto {
    pagination;
    static paginated(data, pagination, metadata) {
        const response = new PaginatedApiResponseDto({
            success: true,
            data,
            metadata: {
                timestamp: new Date(),
                version: metadata?.version || 'v1',
                requestId: metadata?.requestId || (0, uuid_1.v4)(),
                responseTime: metadata?.responseTime,
            },
        });
        response.pagination = pagination;
        return response;
    }
}
exports.PaginatedApiResponseDto = PaginatedApiResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Pagination information',
        type: PaginationMetadataDto,
    }),
    __metadata("design:type", PaginationMetadataDto)
], PaginatedApiResponseDto.prototype, "pagination", void 0);
//# sourceMappingURL=api-response.dto.js.map