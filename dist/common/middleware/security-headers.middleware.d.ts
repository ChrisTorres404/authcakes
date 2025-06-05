import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
export declare class SecurityHeadersMiddleware implements NestMiddleware {
    private readonly configService;
    constructor(configService: ConfigService);
    use(req: Request, res: Response, next: NextFunction): void;
    private isSensitiveEndpoint;
}
