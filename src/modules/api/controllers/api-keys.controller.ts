// src/modules/api/controllers/api-keys.controller.ts
import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Patch, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiKeysService } from '../services/api-keys.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async create(@Request() req, @Body() createApiKeyDto: any) {
    if (!req.user.tenantId) {
      console.warn('[ApiKeysController] Warning: tenantId is missing in request context');
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
  async findAll(@Request() req) {
    if (!req.user.tenantId) {
      console.warn('[ApiKeysController] Warning: tenantId is missing in request context');
      throw new BadRequestException('Tenant ID is required');
    }
    return this.apiKeysService.findAll(req.user.id, req.user.tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.apiKeysService.findOne(id, req.user.id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Request() req, @Body() updateApiKeyDto: any) {
    return this.apiKeysService.update(id, req.user.id, updateApiKeyDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.apiKeysService.revoke(id, req.user.id);
  }

  @Post(':id/revoke')
  async revoke(@Param('id') id: string, @Request() req) {
    return this.apiKeysService.revoke(id, req.user.id);
  }

  @Delete(':id/permanent')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async permanentDelete(@Param('id') id: string, @Request() req) {
    // For added security, only allow admin users to permanently delete API keys
    const apiKey = await this.apiKeysService.findOne(id, req.user.id);
    
    if (apiKey.userId !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenException('You do not have permission to permanently delete this API key');
    }
    
    return this.apiKeysService.delete(id, req.user.id);
  }
}