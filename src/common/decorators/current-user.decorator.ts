import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

/**
 * Decorator to extract the current authenticated user from the JWT payload
 * Provides type-safe access to the authenticated user's information
 * 
 * @throws UnauthorizedException if no user is found in the request
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;
    
    // Enterprise security: Validate that user payload exists and has required fields
    if (!user || !user.sub || !user.email) {
      throw new UnauthorizedException('Invalid user context');
    }
    
    // Enterprise security: Validate JWT payload structure
    if (typeof user.sub !== 'string' || typeof user.email !== 'string') {
      throw new UnauthorizedException('Malformed user context');
    }
    
    return user;
  },
);
