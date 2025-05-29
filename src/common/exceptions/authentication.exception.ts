import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthenticationException extends HttpException {
  constructor(message = 'Authentication failed', errorCode = 'AUTH_ERROR') {
    super({ message, errorCode }, HttpStatus.UNAUTHORIZED);
  }
}
