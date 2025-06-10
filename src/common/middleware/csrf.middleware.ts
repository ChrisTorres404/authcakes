import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly CSRF_HEADER = 'x-csrf-token';
  private readonly CSRF_COOKIE = '_csrf';
  private readonly TOKEN_LENGTH = 32;
  private readonly SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for safe HTTP methods
    if (this.SAFE_METHODS.includes(req.method)) {
      return next();
    }

    // Skip CSRF for API calls with valid JWT (API clients don't use CSRF)
    if (req.headers.authorization?.startsWith('Bearer ')) {
      return next();
    }

    // Skip CSRF for Swagger UI requests (development/testing)
    const referer = req.headers.referer || '';
    if (referer.includes('/api/docs')) {
      return next();
    }

    const cookieToken = req.cookies[this.CSRF_COOKIE];
    const headerToken = req.headers[this.CSRF_HEADER] as string;

    // Generate new token if none exists
    if (!cookieToken) {
      const newToken = this.generateToken();
      res.cookie(this.CSRF_COOKIE, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400000, // 24 hours
      });
      
      // For initial requests, set the token in response header
      res.setHeader(this.CSRF_HEADER, newToken);
      
      // Allow the request to proceed (first-time setup)
      return next();
    }

    // Validate CSRF token
    if (!headerToken || !this.validateToken(cookieToken, headerToken)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    next();
  }

  private generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  private validateToken(cookieToken: string, headerToken: string): boolean {
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
  }
}

// Helper function to get CSRF token from cookies
export function getCsrfToken(req: Request): string | undefined {
  return req.cookies['_csrf'];
}