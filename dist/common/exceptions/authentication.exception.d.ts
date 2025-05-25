import { HttpException } from '@nestjs/common';
export declare class AuthenticationException extends HttpException {
    constructor(message?: string, errorCode?: string);
}
