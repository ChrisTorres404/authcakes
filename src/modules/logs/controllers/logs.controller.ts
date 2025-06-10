// src/modules/logs/controllers/logs.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { LogsService } from '../services/logs.service';
import { Log } from '../entities/log.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { TenantAuthGuard } from '../../../common/guards/tenant-auth.guard';
import { TenantRoles } from '../../../common/decorators/tenant-roles.decorator';

interface LogFilters {
  userId?: string;
  tenantId?: string;
  action?: string;
}

interface AdminLogData {
  action: string;
  details: Record<string, unknown>;
}

@ApiTags('Logs')
@Controller('v1/logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user logs' })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'List of user logs' })
  async findMyLogs(
    @Req() req: Request & { user: { id: string } },
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<[Log[], number]> {
    return this.logsService.findUserLogs(req.user.id, page, limit);
  }

  @Get('tenant/:tenantId')
  @UseGuards(TenantAuthGuard)
  @TenantRoles('admin')
  @ApiOperation({ summary: 'Get tenant logs' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'List of tenant logs' })
  async findTenantLogs(
    @Param('tenantId') tenantId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<[Log[], number]> {
    return this.logsService.findTenantLogs(tenantId, page, limit);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get admin logs' })
  @ApiQuery({ name: 'userId', type: String, required: false })
  @ApiQuery({ name: 'tenantId', type: String, required: false })
  @ApiQuery({ name: 'action', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'List of admin logs' })
  async findAdminLogs(
    @Query('userId') userId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('action') action?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<[Log[], number]> {
    const filters: LogFilters = {};

    if (userId) filters.userId = userId;
    if (tenantId) filters.tenantId = tenantId;
    if (action) filters.action = action;

    return this.logsService.findAll(filters, page, limit);
  }

  @Post('admin/log')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create admin log' })
  @ApiResponse({ status: 201, description: 'Admin log created' })
  async createAdminLog(
    @Req() req: Request & { user: { id: string } },
    @Body() logData: AdminLogData,
  ): Promise<void> {
    return this.logsService.logAdminAction(
      logData.action,
      req.user.id,
      logData.details,
      req,
    );
  }
}
