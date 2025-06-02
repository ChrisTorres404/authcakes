import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Remove server identification headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // Strict Transport Security (HSTS)
    const hstsMaxAge = this.configService.get<number>('HSTS_MAX_AGE', 31536000); // 1 year
    res.setHeader('Strict-Transport-Security', `max-age=${hstsMaxAge}; includeSubDomains; preload`);

    // Content Security Policy
    const cspDefaultSrc = this.configService.get<string>('CSP_DEFAULT_SRC', "'self'");
    const cspScriptSrc = this.configService.get<string>('CSP_SCRIPT_SRC', "'self'");
    const cspStyleSrc = this.configService.get<string>('CSP_STYLE_SRC', "'self' 'unsafe-inline'");
    const cspImgSrc = this.configService.get<string>('CSP_IMG_SRC', "'self' data: https:");
    
    const cspPolicy = [
      `default-src ${cspDefaultSrc}`,
      `script-src ${cspScriptSrc}`,
      `style-src ${cspStyleSrc}`,
      `img-src ${cspImgSrc}`,
      `font-src 'self'`,
      `connect-src 'self'`,
      `frame-ancestors 'none'`,
      `form-action 'self'`,
      `base-uri 'self'`,
      `object-src 'none'`,
      `media-src 'self'`,
    ].join('; ');
    
    res.setHeader('Content-Security-Policy', cspPolicy);

    // X-Frame-Options (prevent clickjacking)
    const xFrameOptions = this.configService.get<string>('X_FRAME_OPTIONS', 'DENY');
    res.setHeader('X-Frame-Options', xFrameOptions);

    // X-Content-Type-Options (prevent MIME sniffing)
    const xContentTypeOptions = this.configService.get<string>('X_CONTENT_TYPE_OPTIONS', 'nosniff');
    res.setHeader('X-Content-Type-Options', xContentTypeOptions);

    // X-XSS-Protection (legacy XSS protection)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy (formerly Feature Policy)
    const permissionsPolicy = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()',
    ].join(', ');
    res.setHeader('Permissions-Policy', permissionsPolicy);

    // Cross-Origin Embedder Policy
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    // Cross-Origin Opener Policy
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    // Cross-Origin Resource Policy
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Cache Control for sensitive endpoints
    if (this.isSensitiveEndpoint(req.path)) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }

    // Security-focused custom headers
    res.setHeader('X-Content-Security-Policy', cspPolicy); // Legacy support
    res.setHeader('X-WebKit-CSP', cspPolicy); // Legacy WebKit support
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Enterprise security identifier
    res.setHeader('X-Security-Level', 'enterprise');
    res.setHeader('X-API-Version', '1.0');

    next();
  }

  private isSensitiveEndpoint(path: string): boolean {
    const sensitivePatterns = [
      '/auth/',
      '/users/',
      '/admin/',
      '/settings/',
      '/tenants/',
    ];
    return sensitivePatterns.some(pattern => path.includes(pattern));
  }
}