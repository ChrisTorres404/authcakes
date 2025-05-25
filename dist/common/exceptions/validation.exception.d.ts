import { HttpException, HttpStatus } from '@nestjs/common';
export declare class ValidationException extends HttpException {
    constructor(message?: string, errorCode?: string, status?: HttpStatus);
}
