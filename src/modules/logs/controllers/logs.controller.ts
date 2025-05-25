// src/modules/logs/controllers/logs.controller.ts
import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { LogsService } from '../services/logs.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { TenantAuthGuard } from '../../../common/guards/tenant-auth.guard';
import { TenantRoles } from '../../../common/decorators/tenant-roles.decorator';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('me')
  async findMyLogs(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.logsService.findUserLogs(req.user.id, page, limit);
  }

  @Get('tenant/:tenantId')
  @UseGuards(TenantAuthGuard)
  @TenantRoles('admin')
  async findTenantLogs(
    @Param('tenantId') tenantId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.logsService.findTenantLogs(tenantId, page, limit);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAdminLogs(
    @Query('userId') userId: string,
    @Query('tenantId') tenantId: string,
    @Query('action') action: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const filters: any = {};
    
    if (userId) filters.userId = userId;
    if (tenantId) filters.tenantId = tenantId;
    if (action) filters.action = action;
    
    return this.logsService.findAll(filters, page, limit);
  }

  @Post('admin/log')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async createAdminLog(@Request() req, @Body() logData: any) {
    return this.logsService.logAdminAction(
      logData.action,
      req.user.id,
      logData.details,
      req,
    );
  }
}