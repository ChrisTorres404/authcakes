import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from '../../logs/entities/log.entity';

interface AuditLogDetails {
  userId?: string;
  tenantId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: unknown;
}

interface ProfileChange {
  before: unknown;
  after: unknown;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(Log)
    private readonly logsRepository: Repository<Log>,
  ) {}

  /**
   * Log an event to the audit log
   * @param event - The event type to log
   * @param details - Additional details about the event
   * @param details.userId - Optional ID of the user related to the event
   * @param details.tenantId - Optional ID of the tenant related to the event
   * @param details.ip - Optional IP address of the request
   * @param details.userAgent - Optional user agent of the request
   */
  async log(event: string, details: AuditLogDetails): Promise<void> {
    // Only log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AuditLog] ${event}:`, details);
    }

    // Create log entry
    const log = this.logsRepository.create({
      action: event,
      userId: details.userId,
      tenantId: details.tenantId,
      ip: details.ip,
      userAgent: details.userAgent,
      details: details,
    });

    // Save to database
    await this.logsRepository.save(log);
  }

  /**
   * Log a profile update with before/after values
   * @param userId - ID of the user whose profile was updated
   * @param updatedBy - ID of the user who made the update
   * @param changes - Object containing field changes with before/after values
   * @param ip - Optional IP address of the request
   * @param userAgent - Optional user agent of the request
   */
  async logProfileUpdate(
    userId: string,
    updatedBy: string,
    changes: Record<string, ProfileChange>,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    const event = 'profile_update';
    const details = {
      userId,
      updatedBy,
      changes,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    };

    return this.log(event, details);
  }
}
