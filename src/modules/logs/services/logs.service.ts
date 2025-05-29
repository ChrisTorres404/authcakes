import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { Log } from '../entities/log.entity';

interface LogFilters {
  userId?: string;
  tenantId?: string;
  action?: string;
}

interface LogDetails extends Record<string, unknown> {
  metadata?: Record<string, unknown>;
  error?: string;
  context?: string;
}

interface RequestInfo {
  ip?: string;
  userAgent?: string;
}

/**
 * Service for managing system logs and audit trails
 */
@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Log)
    private logsRepository: Repository<Log>,
  ) {}

  /**
   * Creates a new log entry
   * @param logData - Partial log data to create
   * @returns Created log entry
   */
  async create(logData: Partial<Log>): Promise<Log> {
    const log = this.logsRepository.create({
      ...logData,
      timestamp: new Date(),
    });

    return this.logsRepository.save(log);
  }

  /**
   * Finds all logs matching the given filters with pagination
   * @param filters - Log filters to apply
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   * @returns Tuple of [logs, total count]
   */
  async findAll(
    filters: LogFilters = {},
    page = 1,
    limit = 20,
  ): Promise<[Log[], number]> {
    const query: LogFilters = {};

    // Apply filters
    if (filters.userId) query.userId = filters.userId;
    if (filters.tenantId) query.tenantId = filters.tenantId;
    if (filters.action) query.action = filters.action;

    return this.logsRepository.findAndCount({
      where: query,
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'tenant'],
    });
  }

  async findUserLogs(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<[Log[], number]> {
    return this.findAll({ userId }, page, limit);
  }

  async findTenantLogs(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<[Log[], number]> {
    if (!tenantId) {
      console.warn(
        '[LogsService] Warning: tenantId is missing in findTenantLogs',
      );
    }
    return this.findAll({ tenantId }, page, limit);
  }

  /**
   * Logs an authentication-related event
   * @param action - Action identifier
   * @param userId - User ID (optional)
   * @param details - Event details
   * @param request - Express request object (optional)
   */
  async logAuthEvent(
    action: string,
    userId: string | null,
    details: LogDetails = {},
    request?: Request,
  ): Promise<void> {
    await this.create({
      action,
      userId: userId ?? undefined,
      details,
      ip: request?.ip,
      userAgent: request?.headers?.['user-agent'],
    });
  }

  /**
   * Logs a tenant-related event
   * @param action - Action identifier
   * @param userId - User ID
   * @param tenantId - Tenant ID
   * @param details - Event details
   * @param request - Express request object (optional)
   */
  async logTenantEvent(
    action: string,
    userId: string,
    tenantId: string,
    details: LogDetails = {},
    request?: Request,
  ): Promise<void> {
    if (!tenantId) {
      console.warn(
        '[LogsService] Warning: tenantId is missing in logTenantEvent',
      );
    }
    await this.create({
      action,
      userId: userId ?? undefined,
      tenantId,
      details,
      ip: request?.ip,
      userAgent: request?.headers?.['user-agent'],
    });
  }

  /**
   * Logs an administrative action
   * @param action - Action identifier
   * @param userId - User ID
   * @param details - Action details
   * @param request - Express request object (optional)
   */
  async logAdminAction(
    action: string,
    userId: string,
    details: LogDetails = {},
    request?: Request,
  ): Promise<void> {
    await this.create({
      action: `admin:${action}`,
      userId: userId ?? undefined,
      details,
      ip: request?.ip,
      userAgent: request?.headers?.['user-agent'],
    });
  }
}
