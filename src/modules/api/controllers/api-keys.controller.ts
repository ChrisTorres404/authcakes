// src/modules/api/controllers/api-keys.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Patch,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { ApiKeysService } from '../services/api-keys.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { UpdateApiKeyDto } from '../dto/update-api-key.dto';
import {
  ApiKeyResponseDto,
  ApiKeyListResponseDto,
} from '../dto/api-key-response.dto';
import { User } from '../../users/entities/user.entity';

interface RequestWithUser extends ExpressRequest {
  user: User & {
    id: string;
    tenantId?: string;
    role?: string;
  };
}

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller('v1/api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  private readonly logger = new Logger(ApiKeysController.name);

  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, type: ApiKeyResponseDto })
  async create(
    @Request() req: RequestWithUser,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    if (!req.user.tenantId) {
      this.logger.warn('tenantId is missing in request context');
      throw new BadRequestException('Tenant ID is required');
    }
    return this.apiKeysService.create(
      req.user.id,
      req.user.tenantId,
      createApiKeyDto.name,
      createApiKeyDto.permissions,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all API keys' })
  @ApiResponse({ status: 200, type: ApiKeyListResponseDto })
  async findAll(
    @Request() req: RequestWithUser,
  ): Promise<ApiKeyListResponseDto> {
    if (!req.user.tenantId) {
      this.logger.warn('tenantId is missing in request context');
      throw new BadRequestException('Tenant ID is required');
    }
    const apiKeys = await this.apiKeysService.findAll(
      req.user.id,
      req.user.tenantId,
    );
    return { apiKeys };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an API key by ID' })
  @ApiResponse({ status: 200, type: ApiKeyResponseDto })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeysService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an API key' })
  @ApiResponse({ status: 200, type: ApiKeyResponseDto })
  async update(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeysService.update(id, req.user.id, updateApiKeyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 200, type: ApiKeyResponseDto })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeysService.revoke(id, req.user.id);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke an API key (alternative endpoint)' })
  @ApiResponse({ status: 200, type: ApiKeyResponseDto })
  async revoke(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeysService.revoke(id, req.user.id);
  }

  @Delete(':id/permanent')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Permanently delete an API key (admin only)' })
  @ApiResponse({ status: 200, type: ApiKeyResponseDto })
  async permanentDelete(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<ApiKeyResponseDto> {
    // For added security, only allow admin users to permanently delete API keys
    const apiKey = await this.apiKeysService.findOne(id, req.user.id);

    if (apiKey.userId !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenException(
        'You do not have permission to permanently delete this API key',
      );
    }

    return this.apiKeysService.delete(id, req.user.id);
  }
}
