import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware for logging HTTP requests in the application.
 * Captures and logs the HTTP method, URL, and response status code for each request.
 *
 * @implements {NestMiddleware}
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  /**
   * Processes the HTTP request and logs its details upon completion.
   *
   * @param {Request} req - The Express request object
   * @param {Response} res - The Express response object
   * @param {NextFunction} next - Express next function to pass control to the next middleware
   * @returns {void}
   */
  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const { statusCode } = res;
      this.logger.log(`${method} ${originalUrl} ${statusCode}`);
    });

    next();
  }
}
