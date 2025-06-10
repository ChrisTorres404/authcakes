import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class StrictValidationPipe extends ValidationPipe {
  constructor() {
    super({
      // Strip properties that are not defined in the DTO
      whitelist: true,
      
      // Throw error if non-whitelisted properties are present
      forbidNonWhitelisted: true,
      
      // Automatically transform payloads to DTO instances
      transform: true,
      
      // Transform options
      transformOptions: {
        // Don't allow implicit type conversion (e.g., string "true" to boolean true)
        enableImplicitConversion: false,
      },
      
      // Disable error messages in production for security
      disableErrorMessages: process.env.NODE_ENV === 'production',
      
      // Custom error factory for consistent error responses
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errors = validationErrors.map((error) => ({
          field: error.property,
          value: process.env.NODE_ENV === 'production' ? undefined : error.value,
          constraints: error.constraints,
          children: error.children?.length > 0 ? this.mapChildrenErrors(error.children) : undefined,
        }));

        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          error: 'Bad Request',
          details: errors,
        });
      },
      
      // Validation error options
      validationError: {
        // Don't expose the target object in error messages
        target: false,
        // Don't expose the value that failed validation in production
        value: process.env.NODE_ENV !== 'production',
      },
      
      // Skip validation if no metadata is found
      skipMissingProperties: false,
      
      // Skip validation of null values
      skipNullProperties: false,
      
      // Skip validation of undefined values
      skipUndefinedProperties: false,
      
      // Validate nested objects
      validateNestedObjects: true,
    });
  }

  private mapChildrenErrors(children: ValidationError[]): any[] {
    return children.map((child) => ({
      field: child.property,
      constraints: child.constraints,
      children: child.children?.length > 0 ? this.mapChildrenErrors(child.children) : undefined,
    }));
  }
}