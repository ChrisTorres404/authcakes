import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  constructor(
    message = 'Validation failed',
    errorCode = 'VALIDATION_ERROR',
    status = HttpStatus.BAD_REQUEST,
  ) {
    super({ message, errorCode }, status);
  }
}
