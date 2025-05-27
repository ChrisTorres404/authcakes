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
    Query
  } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiOkResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiForbiddenResponse, ApiUnauthorizedResponse, ApiQuery } from '@nestjs/swagger';
import { TenantsService } from '../services/tenants.service';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { AddUserToTenantDto } from '../dto/add-user-to-tenant.dto';
import { UpdateTenantMembershipDto } from '../dto/update-tenant-membership.dto';
import { TenantRoles } from '../../../common/decorators/tenant-roles.decorator';
import { TenantAuthGuard } from '../../../common/guards/tenant-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { TenantResponseDto } from '../dto/tenant-response.dto';
import { ApiResponseDto, ApiErrorResponseDto } from '../dto/api-response.dto';
import { Tenant } from '../entities/tenant.entity';
import { InviteTenantMemberDto, UpdateTenantMemberRoleDto } from '../dto/tenant-member.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuccessResponseDto } from '../dto/success-response.dto';
  
function toTenantResponseDto(tenant: Tenant): TenantResponseDto {
  return {
    ...tenant,
    createdAt: tenant.createdAt.toISOString(),
    updatedAt: tenant.updatedAt.toISOString(),
  };
}
  
@ApiTags('tenants')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Authentication required or invalid/missing token.' })
@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}
  
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiOkResponse({ type: ApiResponseDto, description: 'Tenant created successfully.' })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Bad request error.' })
  @ApiBody({ type: CreateTenantDto })
  @Post()
  async createTenant(@Body() dto: CreateTenantDto): Promise<ApiResponseDto<TenantResponseDto>> {
    try {
      const tenant = await this.tenantsService.createTenant(dto);
      return { success: true, data: toTenantResponseDto(tenant), message: 'Tenant created successfully.' };
    } catch (e) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        error: 'Bad Request',
        message: e.message,
        errorCode: 'TENANT_CREATE_FAILED',
      });
    }
  }
  
  @ApiOperation({ summary: 'List all tenants' })
  @ApiOkResponse({ type: ApiResponseDto, description: 'List of tenants.' })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Bad request error.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for tenant name or other fields' })
  @Get()
  async listTenants(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string
  ): Promise<ApiResponseDto<TenantResponseDto[]>> {
    const tenants = await this.tenantsService.listTenants({ page, limit, search });
    return { success: true, data: tenants.map(toTenantResponseDto) };
  }
  
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ type: ApiResponseDto, description: 'Tenant details.' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto, description: 'Tenant not found.' })
  @Get(':id')
  async getTenantById(@Param('id') id: string): Promise<ApiResponseDto<TenantResponseDto>> {
    try {
      const tenant = await this.tenantsService.getTenantById(id);
      return { success: true, data: toTenantResponseDto(tenant), message: 'Tenant fetched successfully.' };
    } catch (e) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: 'Tenant not found',
        errorCode: 'TENANT_NOT_FOUND',
      });
    }
  }
  
  @ApiOperation({ summary: 'Update tenant' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateTenantDto })
  @ApiOkResponse({ type: SuccessResponseDto, description: 'Tenant updated.' })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Bad request error.' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto, description: 'Tenant not found.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @Patch(':id')
  async updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto): Promise<SuccessResponseDto> {
    await this.tenantsService.updateTenant(id, dto);
    return { success: true };
  }
  
  @ApiOperation({ summary: 'Delete tenant' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ type: SuccessResponseDto, description: 'Tenant deleted.' })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Bad request error.' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto, description: 'Tenant not found.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @Delete(':id')
  async deleteTenant(@Param('id') id: string): Promise<SuccessResponseDto> {
    await this.tenantsService.deleteTenant(id);
    return { success: true };
  }
  
  @ApiOperation({ summary: 'List tenant memberships' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'List of tenant memberships.' })
  @Get(':id/members')
  @UseGuards(TenantAuthGuard)
  async listTenantMemberships(@Param('id') tenantId: string) {
    if (!tenantId) {
      console.warn('[TenantsController] Warning: tenantId is missing in listTenantMemberships');
      throw new BadRequestException('Tenant ID is required');
    }
    return this.tenantsService.listTenantMemberships(tenantId);
  }
  
  @ApiOperation({ summary: 'Add user to tenant' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: AddUserToTenantDto })
  @ApiResponse({ status: 201, description: 'User added to tenant.' })
  @Post(':id/members')
  @UseGuards(TenantAuthGuard)
  @TenantRoles('admin')
  async addUserToTenant(@Param('id') tenantId: string, @Body() dto: AddUserToTenantDto) {
    if (!tenantId) {
      console.warn('[TenantsController] Warning: tenantId is missing in addUserToTenant');
      throw new BadRequestException('Tenant ID is required');
    }
    return this.tenantsService.addUserToTenant(tenantId, dto.userId, dto.role);
  }
  
  @ApiOperation({ summary: 'Update tenant membership role' })
  @ApiParam({ name: 'membershipId', type: 'string' })
  @ApiBody({ type: UpdateTenantMembershipDto })
  @ApiResponse({ status: 200, description: 'Membership role updated.' })
  @Patch('members/:membershipId')
  @UseGuards(TenantAuthGuard)
  @TenantRoles('admin')
  async updateTenantMembership(@Param('membershipId') membershipId: string, @Body() dto: UpdateTenantMembershipDto) {
    return this.tenantsService.updateTenantMembership(membershipId, dto.role);
  }
  
  @ApiOperation({ summary: 'Remove user from tenant' })
  @ApiParam({ name: 'tenantId', type: 'string' })
  @ApiParam({ name: 'userId', type: 'string' })
  @ApiResponse({ status: 200, description: 'User removed from tenant.' })
  @Delete(':tenantId/members/:userId')
  @UseGuards(TenantAuthGuard)
  @TenantRoles('admin')
  async removeUserFromTenant(@Param('tenantId') tenantId: string, @Param('userId') userId: string) {
    if (!tenantId) {
      console.warn('[TenantsController] Warning: tenantId is missing in removeUserFromTenant');
      throw new BadRequestException('Tenant ID is required');
    }
    await this.tenantsService.removeUserFromTenant(tenantId, userId);
    return { success: true };
  }
  
  @Get(':id/settings')
  @UseGuards(TenantAuthGuard)
  @TenantRoles('admin')
  getSettings(@Param('id') id: string) {
    return this.tenantsService.getTenantSettings(id);
  }
  
  @Patch(':id/settings')
  @UseGuards(TenantAuthGuard)
  @TenantRoles('admin')
  updateSettings(@Param('id') id: string, @Body() settings: any) {
    return this.tenantsService.updateTenantSettings(id, settings);
  }

  @Get(':tenantId/members')
  @UseGuards(JwtAuthGuard, TenantAuthGuard)
  @ApiOperation({ summary: 'List all members of a tenant' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of tenant members' })
  async getMembers(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    if (!tenantId) {
      console.warn('[TenantsController] Warning: tenantId is missing in getMembers');
      throw new BadRequestException('Tenant ID is required');
    }
    return this.tenantsService.getMembers(tenantId);
  }

  @Post(':tenantId/invite')
  @UseGuards(JwtAuthGuard, TenantAuthGuard)
  @ApiOperation({ summary: 'Invite a user to a tenant' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  @ApiBody({ type: InviteTenantMemberDto })
  @ApiResponse({ status: 201, description: 'Invitation sent' })
  async inviteMember(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: InviteTenantMemberDto,
  ) {
    if (!tenantId) {
      console.warn('[TenantsController] Warning: tenantId is missing in inviteMember');
      throw new BadRequestException('Tenant ID is required');
    }
    return this.tenantsService.inviteMember(tenantId, dto);
  }

  @Patch(':tenantId/members/:userId')
  @UseGuards(JwtAuthGuard, TenantAuthGuard)
  @ApiOperation({ summary: 'Update a tenant member role' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateTenantMemberRoleDto })
  @ApiResponse({ status: 200, description: 'Role updated' })
  async updateMemberRole(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateTenantMemberRoleDto,
  ) {
    if (!tenantId) {
      console.warn('[TenantsController] Warning: tenantId is missing in updateMemberRole');
      throw new BadRequestException('Tenant ID is required');
    }
    return this.tenantsService.updateMemberRole(tenantId, userId, dto);
  }

  @Delete(':tenantId/members/:userId')
  @UseGuards(JwtAuthGuard, TenantAuthGuard)
  @ApiOperation({ summary: 'Remove a user from a tenant' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User removed' })
  async removeMember(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    if (!tenantId) {
      console.warn('[TenantsController] Warning: tenantId is missing in removeMember');
      throw new BadRequestException('Tenant ID is required');
    }
    return this.tenantsService.removeMember(tenantId, userId);
  }
}