import { ValidationPipe } from '@nestjs/common';
export declare class StrictValidationPipe extends ValidationPipe {
    constructor();
    private mapChildrenErrors;
}
