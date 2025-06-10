"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrictValidationPipe = void 0;
const common_1 = require("@nestjs/common");
class StrictValidationPipe extends common_1.ValidationPipe {
    constructor() {
        super({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: false,
            },
            disableErrorMessages: process.env.NODE_ENV === 'production',
            exceptionFactory: (validationErrors = []) => {
                const errors = validationErrors.map((error) => ({
                    field: error.property,
                    value: process.env.NODE_ENV === 'production' ? undefined : error.value,
                    constraints: error.constraints,
                    children: error.children && error.children.length > 0 ? this.mapChildrenErrors(error.children) : undefined,
                }));
                return new common_1.BadRequestException({
                    statusCode: 400,
                    message: 'Validation failed',
                    error: 'Bad Request',
                    details: errors,
                });
            },
            validationError: {
                target: false,
                value: process.env.NODE_ENV !== 'production',
            },
            skipMissingProperties: false,
            skipNullProperties: false,
            skipUndefinedProperties: false,
        });
    }
    mapChildrenErrors(children) {
        return children.map((child) => ({
            field: child.property,
            constraints: child.constraints,
            children: child.children && child.children.length > 0 ? this.mapChildrenErrors(child.children) : undefined,
        }));
    }
}
exports.StrictValidationPipe = StrictValidationPipe;
//# sourceMappingURL=strict-validation.pipe.js.map