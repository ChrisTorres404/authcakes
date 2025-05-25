import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditLogService {
  log(event: string, details: any) {
    // In production, log to DB or external system
    console.log(`[AuditLog] ${event}:`, details);
  }
} 