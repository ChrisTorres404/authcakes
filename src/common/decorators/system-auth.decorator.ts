import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { SystemAuthGuard } from '../guards/system-auth.guard';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

/**
 * Decorator to require only system-level authentication
 */
export function SystemAuth() {
  return applyDecorators(
    UseGuards(SystemAuthGuard),
    ApiSecurity('SystemApiKey'),
    ApiSecurity('SystemJWT'),
  );
}

/**
 * Decorator to require both system and user authentication
 */
export function SystemAndUserAuth() {
  return applyDecorators(
    UseGuards(SystemAuthGuard, JwtAuthGuard),
    ApiSecurity('SystemApiKey'),
    ApiSecurity('SystemJWT'),
    ApiSecurity('UserJWT'),
  );
}

/**
 * Decorator to require user authentication (with optional system auth based on config)
 */
export function UserAuth() {
  return applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiSecurity('UserJWT'),
  );
}