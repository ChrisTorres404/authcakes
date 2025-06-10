export declare class ApiErrorDto {
    code: string;
    message: string;
    details?: any;
}
export declare class ApiMetadataDto {
    timestamp: Date;
    version: string;
    requestId: string;
    responseTime?: number;
}
export declare class ApiResponseDto<T = any> {
    success: boolean;
    data?: T;
    error?: ApiErrorDto;
    metadata: ApiMetadataDto;
    constructor(partial?: Partial<ApiResponseDto<T>>);
    static success<T>(data: T, metadata?: Partial<ApiMetadataDto>): ApiResponseDto<T>;
    static error(code: string, message: string, details?: any, metadata?: Partial<ApiMetadataDto>): ApiResponseDto<null>;
}
export declare class PaginationMetadataDto {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
export declare class PaginatedApiResponseDto<T> extends ApiResponseDto<T> {
    pagination: PaginationMetadataDto;
    static paginated<T>(data: T, pagination: PaginationMetadataDto, metadata?: Partial<ApiMetadataDto>): PaginatedApiResponseDto<T>;
}
