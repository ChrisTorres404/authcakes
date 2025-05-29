import { HttpException, HttpStatus } from '@nestjs/common';

export class TenantAccessException extends HttpException {
  constructor(
    message = 'Access to tenant denied',
    errorCode = 'TENANT_ACCESS_DENIED',
  ) {
    super({ message, errorCode }, HttpStatus.FORBIDDEN);
  }
}
