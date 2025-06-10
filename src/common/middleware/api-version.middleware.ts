import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ApiVersionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Use originalUrl to get the full path including the prefix
    const fullPath = req.originalUrl || req.url;
    
    // Extract version from path - /api/v1/... -> v1
    const pathSegments = fullPath.split('/').filter(segment => segment && !segment.includes('?')); // Remove empty segments and query params
    const apiIndex = pathSegments.findIndex(segment => segment === 'api');
    
    let version = 'v1'; // Default version
    
    // Check if there's a segment after 'api' and if it matches version pattern
    if (apiIndex !== -1 && apiIndex + 1 < pathSegments.length) {
      const nextSegment = pathSegments[apiIndex + 1];
      // Check if the next segment is a version (starts with 'v' followed by numbers)
      if (/^v\d+$/.test(nextSegment)) {
        version = nextSegment;
      }
    }
    
    // Add version to request object for use in controllers/services
    req['apiVersion'] = version;
    
    // Add version header to response
    res.setHeader('X-API-Version', version);
    
    next();
  }
}