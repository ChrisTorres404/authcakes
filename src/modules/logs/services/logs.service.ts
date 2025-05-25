// src/modules/logs/services/logs.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from 'src/modules/logs/entities/log.entity';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Log)
    private logsRepository: Repository<Log>,
  ) {}

  async create(logData: Partial<Log>): Promise<Log> {
    const log = this.logsRepository.create({
      ...logData,
      timestamp: new Date(),
    });
    
    return this.logsRepository.save(log);
  }

  async findAll(filters: Partial<Log> = {}, page = 1, limit = 20): Promise<[Log[], number]> {
    const query: any = {};
    
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

  async findUserLogs(userId: string, page = 1, limit = 20): Promise<[Log[], number]> {
    return this.findAll({ userId }, page, limit);
  }

  async findTenantLogs(tenantId: string, page = 1, limit = 20): Promise<[Log[], number]> {
    if (!tenantId) {
      console.warn('[LogsService] Warning: tenantId is missing in findTenantLogs');
    }
    return this.findAll({ tenantId }, page, limit);
  }

  async logAuthEvent(action: string, userId: string | null, details: any = {}, request?: any): Promise<void> {
    await this.create({
      action,
      userId: userId ?? undefined,
      details,
      ip: request?.ip,
      userAgent: request?.headers?.['user-agent'],
    });
  }
  
  async logTenantEvent(action: string, userId: string, tenantId: string, details: any = {}, request?: any): Promise<void> {
    if (!tenantId) {
      console.warn('[LogsService] Warning: tenantId is missing in logTenantEvent');
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
  
  async logAdminAction(action: string, userId: string, details: any = {}, request?: any): Promise<void> {
    await this.create({
      action: `admin:${action}`,
      userId: userId ?? undefined,
      details,
      ip: request?.ip,
      userAgent: request?.headers?.['user-agent'],
    });
  }
}