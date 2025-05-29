export declare class ApiResponseDto<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
}
export declare class ApiErrorResponseDto {
    success: boolean;
    statusCode: number;
    error: string;
    message: string;
    errorCode: string;
}
