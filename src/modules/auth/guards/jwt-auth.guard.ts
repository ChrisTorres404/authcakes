import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Exempt routes marked with @Public from authentication
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest();
    console.log('[JwtAuthGuard] canActivate called. isPublic:', isPublic, 'url:', req.url, 'headers:', req.headers);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  // Custom error handling for unauthorized access
  handleRequest(err, user, info, context) {
    const req = context.switchToHttp().getRequest();
    console.log('[JwtAuthGuard] handleRequest called. err:', err, 'user:', user, 'info:', info, 'url:', req.url, 'headers:', req.headers);
    if (err || !user) {
      // You can customize the message or add logging here
      throw new UnauthorizedException('Authentication required: Invalid or missing token');
    }
    return user;
  }
} 