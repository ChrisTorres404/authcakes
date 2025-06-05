import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class CsrfMiddleware implements NestMiddleware {
    private readonly CSRF_HEADER;
    private readonly CSRF_COOKIE;
    private readonly TOKEN_LENGTH;
    private readonly SAFE_METHODS;
    use(req: Request, res: Response, next: NextFunction): void;
    private generateToken;
    private validateToken;
}
export declare function getCsrfToken(req: Request): string | undefined;
