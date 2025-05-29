// src/modules/tenants/controllers/tenants.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
  BadRequestException,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { TenantsService } from '../services/tenants.service';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { AddUserToTenantDto } from '../dto/add-user-to-tenant.dto';
import { UpdateTenantMembershipDto } from '../dto/update-tenant-membership.dto';
import { TenantRoles } from '../../../common/decorators/tenant-roles.decorator';
import { TenantAuthGuard } from '../../../common/guards/tenant-auth.guard';
import { TenantResponseDto } from '../dto/tenant-response.dto';
import { ApiResponseDto, ApiErrorResponseDto } from '../dto/api-response.dto';
import { Tenant } from '../entities/tenant.entity';
import {
  InviteTenantMemberDto,
  UpdateTenantMemberRoleDto,
} from '../dto/tenant-member.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuccessResponseDto } from '../dto/success-response.dto';
import { ApiResponseWithData } from '../../../common/decorators/swagger-generic-response.decorator';
import { TenantMembershipDto } from '../dto/tenant-membership.dto';
import { ApiProperty } from '@nestjs/swagger';
import { TenantInvitationDto, TenantRole } from '../dto/tenant-invitation.dto';
import { TenantMembership } from '../entities/tenant-membership.entity';
import { TenantInvitation } from '../entities/tenant-invitation.entity';

function toTenantMembershipDto(
  membership: TenantMembership,
): TenantMembershipDto {
  return {
    id: membership.id,
    userId: membership.userId,
    tenantId: membership.tenantId,
    role: membership.role as TenantRole,
    createdAt: membership.createdAt.toISOString(),
    updatedAt: membership.updatedAt.toISOString(),
    deletedAt: membership.deletedAt?.toISOString(),
  };
}

function toTenantInvitationDto(
  invitation: TenantInvitation,
): TenantInvitationDto {
  return {
    id: invitation.id,
    tenantId: invitation.tenantId,
    invitedBy: invitation.invitedBy,
    email: invitation.email,
    role: invitation.role,
    token: invitation.token,
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedAt: invitation.acceptedAt?.toISOString(),
    acceptedBy: invitation.acceptedBy,
    createdAt: invitation.createdAt.toISOString(),
    updatedAt: invitation.updatedAt.toISOString(),
  };
}

export type TenantTheme = 'light' | 'dark' | 'system';

export interface TenantSettings {
  timezone?: string;
  theme?: TenantTheme;
  dateFormat?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    slack?: boolean;
  };
  features?: Record<string, boolean>;
  customization?: Record<string, string>;
}

export class TenantSettingsDto {
  @ApiProperty({
    description: 'Tenant settings configuration',
    example: { timezone: 'UTC', theme: 'dark' },
  })
  settings: TenantSettings;
}

function toTenantResponseDto(tenant: Tenant): TenantResponseDto {
  return {
    ...tenant,
    createdAt: tenant.createdAt.toISOString(),
    updatedAt: tenant.updatedAt.toISOString(),
  };
}

@ApiTags('tenants')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Authentication required or invalid/missing token.',
})
@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiOkResponse({
    type: ApiResponseDto,
    description: 'Tenant created successfully.',
  })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Bad request error.',
  })
  @ApiBody({ type: CreateTenantDto })
  @Post()
  async createTenant(
    @Body() dto: CreateTenantDto,
  ): Promise<ApiResponseDto<TenantResponseDto>> {
    try {
      const tenant = await this.tenantsService.createTenant(dto);
      return {
        success: true,
        data: toTenantResponseDto(tenant),
        message: 'Tenant created successfully.',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create tenant';
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        error: 'Bad Request',
        message: errorMessage,
        errorCode: 'TENANT_CREATE_FAILED',
      });
    }
  }

  @ApiOperation({ summary: 'List all tenants' })
  @ApiOkResponse({ type: ApiResponseDto, description: 'List of tenants.' })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Bad request error.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for tenant name or other fields',
  })
  @Get()
  async listTenants(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ): Promise<ApiResponseDto<TenantResponseDto[]>> {
    const tenants = await this.tenantsService.listTenants({
      page,
      limit,
      search,
    });
    return { success: true, data: tenants.map(toTenantResponseDto) };
  }

  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponseWithData(TenantResponseDto)
  @ApiNotFoundResponse({
    type: ApiErrorResponseDto,
    description: 'Tenant not found.',
  })
  @Get(':id')
  async getTenantById(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<TenantResponseDto>> {
    try {
      const tenant = await this.tenantsService.getTenantById(id);
      return {
        success: true,
        data: toTenantResponseDto(tenant),
        message: 'Tenant fetched successfully.',
      };
    } catch (error) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: error instanceof Error ? error.message : 'Tenant not found',
        errorCode: 'TENANT_NOT_FOUND',
      });
    }
  }

  @ApiOperation({ summary: 'Update tenant' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateTenantDto })
  @ApiOkResponse({ type: SuccessResponseDto, description: 'Tenant updated.' })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Bad request error.',
  })
  @ApiNotFoundResponse({
    type: ApiErrorResponseDto,
    description: 'Tenant not found.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @Patch(':id')
  async updateTenant(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<SuccessResponseDto> {
    await this.tenantsService.updateTenant(id, dto);
    return { success: true };
  }

  @ApiOperation({ summary: 'Delete tenant' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ type: SuccessResponseDto, description: 'Tenant deleted.' })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Bad request error.',
  })
  @ApiNotFoundResponse({
    type: ApiErrorResponseDto,
    description: 'Tenant not found.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @Delete(':id')
  async deleteTenant(@Param('id') id: string): Promise<SuccessResponseDto> {
    await this.tenantsService.deleteTenant(id);
    return { success: true };
  }

  @ApiOperation({ summary: 'Add user to tenant' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: AddUserToTenantDto })
  @ApiResponseWithData(TenantMembershipDto)
  @Post(':id/members')
  @UseGuards(TenantAuthGuard)
  @TenantRoles('admin')
  async addUserToTenant(
    @Param('id', ParseUUIDPipe) tenantId: string,
    @Body() dto: AddUserToTenantDto,
  ): Promise<ApiResponseDto<TenantMembershipDto>> {
    if (!tenantId) {
      console.warn(
        '[TenantsController] Warning: tenantId is missing in addUserToTenant',
      );
      throw new BadRequestException('Tenant ID is required');
    }
    const membership = await this.tenantsService.addUserToTenant(
      tenantId,
      dto.userId,
      dto.role,
    );
    return { success: true, data: toTenantMembershipDto(membership) };
  }

  @ApiOperation({ summary: 'Update tenant membership role' })
  @ApiParam({ name: 'membershipId', type: 'string' })
  @ApiBody({ type: UpdateTenantMembershipDto })
  @ApiResponseWithData(TenantMembershipDto)
  @Patch('members/:membershipId')
  @UseGuards(TenantAuthGuard)
  @TenantRoles('admin')
  async updateTenantMembership(
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: UpdateTenantMembershipDto,
  ): Promise<ApiResponseDto<TenantMembershipDto>> {
    const updatedMembership = await this.tenantsService.updateTenantMembership(
      membershipId,
      dto.role,
    );
    return { success: true, data: toTenantMembershipDto(updatedMembership) };
  }

  @ApiOperation({ summary: 'Remove user from tenant' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiOkResponse({ type: SuccessResponseDto, description: 'User removed' })
  @Delete(':tenantId/members/:userId')
  @UseGuards(JwtAuthGuard, TenantAuthGuard)
  @TenantRoles('admin')
  async removeMember(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    await this.tenantsService.removeMember(tenantId, userId);
    return { success: true };
  }

  @Get(':id/settings')
  @UseGuards(TenantAuthGuard)
  @TenantRoles('admin')
  @ApiResponseWithData(TenantSettingsDto)
  async getSettings(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<TenantSettingsDto>> {
    const settings = await this.tenantsService.getTenantSettings(id);
    return { success: true, data: { settings } };
  }

  @Patch(':id/settings')
  @UseGuards(TenantAuthGuard)
  @TenantRoles('admin')
  @ApiResponseWithData(TenantSettingsDto)
  async updateSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TenantSettingsDto,
  ): Promise<ApiResponseDto<TenantSettingsDto>> {
    const updatedSettings = await this.tenantsService.updateTenantSettings(
      id,
      dto.settings,
    );
    return { success: true, data: { settings: updatedSettings } };
  }

  @Get(':tenantId/members')
  @UseGuards(JwtAuthGuard, TenantAuthGuard)
  @ApiOperation({ summary: 'List all members of a tenant' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  @ApiResponseWithData(TenantMembershipDto)
  async getMembers(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ): Promise<ApiResponseDto<TenantMembershipDto[]>> {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    const members = await this.tenantsService.getMembers(tenantId);
    return { success: true, data: members.map(toTenantMembershipDto) };
  }

  @Post(':tenantId/invite')
  @UseGuards(JwtAuthGuard, TenantAuthGuard)
  @ApiOperation({ summary: 'Invite a user to a tenant' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  @ApiBody({ type: InviteTenantMemberDto })
  @ApiResponseWithData(TenantInvitationDto)
  async inviteMember(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: InviteTenantMemberDto,
  ): Promise<ApiResponseDto<TenantInvitationDto>> {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    const invitation = await this.tenantsService.inviteMember(tenantId, dto);
    return { success: true, data: toTenantInvitationDto(invitation) };
  }

  @Patch(':tenantId/members/:userId')
  @UseGuards(JwtAuthGuard, TenantAuthGuard)
  @ApiOperation({ summary: 'Update a tenant member role' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateTenantMemberRoleDto })
  @ApiResponseWithData(TenantMembershipDto)
  async updateMemberRole(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateTenantMemberRoleDto,
  ): Promise<ApiResponseDto<TenantMembershipDto>> {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    const updatedMembership = await this.tenantsService.updateMemberRole(
      tenantId,
      userId,
      dto,
    );
    return { success: true, data: toTenantMembershipDto(updatedMembership) };
  }
}
