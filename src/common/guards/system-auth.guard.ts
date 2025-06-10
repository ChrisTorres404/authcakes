import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class SystemAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    
    // Skip system auth for health checks and docs
    if (request.path === '/api/health' || request.path.includes('/api/docs')) {
      return true;
    }

    // Check for system API key in header
    const systemApiKey = request.headers['x-system-api-key'] as string;
    const systemJwt = request.headers['x-system-authorization'] as string;

    if (!systemApiKey && !systemJwt) {
      throw new UnauthorizedException('System authentication required');
    }

    try {
      if (systemApiKey) {
        // Validate API key
        const validApiKeys = this.configService.get<string[]>('system.apiKeys', []);
        if (!validApiKeys.includes(systemApiKey)) {
          throw new UnauthorizedException('Invalid system API key');
        }
        
        // Store system info in request
        request['system'] = {
          authenticated: true,
          method: 'api-key',
          keyId: this.hashApiKey(systemApiKey),
        };
        
        return true;
      }

      if (systemJwt) {
        // Validate system JWT
        const systemSecret = this.configService.get<string>('system.jwtSecret');
        const payload = await this.jwtService.verifyAsync(systemJwt, {
          secret: systemSecret,
        });

        // Validate JWT claims
        if (payload.type !== 'system' || !payload.clientId) {
          throw new UnauthorizedException('Invalid system token');
        }

        // Check if client is active
        const activeClients = this.configService.get<string[]>('system.activeClients', []);
        if (!activeClients.includes(payload.clientId)) {
          throw new UnauthorizedException('Client not authorized');
        }

        // Store system info in request
        request['system'] = {
          authenticated: true,
          method: 'jwt',
          clientId: payload.clientId,
          issuedAt: payload.iat,
          expiresAt: payload.exp,
        };

        return true;
      }
    } catch (error) {
      throw new UnauthorizedException('System authentication failed');
    }

    return false;
  }

  private hashApiKey(apiKey: string): string {
    // Return last 8 characters for identification
    return `...${apiKey.slice(-8)}`;
  }
}