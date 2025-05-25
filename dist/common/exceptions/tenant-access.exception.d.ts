import { HttpException } from '@nestjs/common';
export declare class TenantAccessException extends HttpException {
    constructor(message?: string, errorCode?: string);
}
