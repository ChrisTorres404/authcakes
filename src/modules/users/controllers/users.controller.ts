// src/modules/users/controllers/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ProfileUpdateGuard } from '../guards/profile-update.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { IsAdminRoute } from '../../../common/decorators/is-admin-route.decorator';
import { TenantAuthGuard } from '../../../common/guards/tenant-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { UserProfileDto } from '../dto/user-profile.dto';
import { Request } from 'express';
import { UserResponseDto } from '../dto/user-response.dto';
import { Logger } from '@nestjs/common';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  @IsAdminRoute()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created', type: User })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  @UseGuards(RolesGuard)
  @IsAdminRoute()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'List of users', type: [User] })
  findAll(@Query('search') search?: string): Promise<User[]> {
    return this.usersService.search(search || '');
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    type: UserProfileDto,
  })
  async getProfile(@CurrentUser() user: JwtPayload): Promise<UserProfileDto> {
    // Security audit trail: Log profile access attempts
    Logger.log(`Profile access - UserID: ${user.sub}, SessionID: ${user.sessionId}`, 'UsersController');
    
    const entity = await this.usersService.findById(user.sub);
    
    // Additional security check: ensure the user from JWT matches the database user
    if (entity.id !== user.sub) {
      Logger.error(`Profile access security violation - JWT UserID: ${user.sub}, DB UserID: ${entity.id}`, 'UsersController');
      throw new NotFoundException('User profile not found');
    }
    
    return {
      id: entity.id,
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      role: entity.role,
      active: entity.active,
      emailVerified: entity.emailVerified,
      phoneVerified: entity.phoneVerified,
      avatar: entity.avatar,
    };
  }

  @Patch('profile')
  @UseGuards(ProfileUpdateGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated', type: User })
  @ApiResponse({
    status: 403,
    description: 'Profile updates not allowed or field update not permitted',
  })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
    @Req() request: Request & { ip: string },
  ) {
    const requestInfo = {
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string,
    };

    return this.usersService.updateProfile(
      user.sub,
      updateUserProfileDto,
      user.sub, // self-update
      requestInfo,
    );
  }

  @Get(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @IsAdminRoute()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const entity = await this.usersService.findById(id);
    // Map entity to DTO
    return {
      id: entity.id,
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      role: entity.role,
      active: entity.active,
      emailVerified: entity.emailVerified,
      avatar: entity.avatar,
      phoneNumber: entity.phoneNumber,
      phoneVerified: entity.phoneVerified,
      lastLogin: entity.lastLogin,
      company: entity.company,
      department: entity.department,
      country: entity.country,
      state: entity.state,
      address: entity.address,
      address2: entity.address2,
      city: entity.city,
      zipCode: entity.zipCode,
      bio: entity.bio,
      mfaEnabled: entity.mfaEnabled,
      mfaType: entity.mfaType,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @IsAdminRoute()
  @ApiOperation({ summary: 'Update user by ID (admin only)' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated', type: User })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() admin: JwtPayload,
    @Req() request: Request,
  ): Promise<User> {
    // For admin updates, use the full update method which doesn't filter fields
    // Also log the admin who made the change
    if (updateUserDto instanceof UpdateUserProfileDto) {
      // If it's a profile update coming through the admin route, use updateProfile for audit
      const requestInfo = {
        ip: request.ip,
        userAgent: request.headers['user-agent'] as string,
      };

      return this.usersService.updateProfile(
        id,
        updateUserDto as UpdateUserProfileDto,
        admin.sub, // admin update
        requestInfo,
      );
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @IsAdminRoute()
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify user email' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['token'],
      properties: { token: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Email verified' })
  async verifyEmail(@Body('token') token: string) {
    return this.usersService.verifyEmail(token);
  }

  @Post('verify-phone')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify user phone' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['token'],
      properties: { token: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Phone verified' })
  async verifyPhone(@Body('token') token: string) {
    return this.usersService.verifyPhone(token);
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard, TenantAuthGuard)
  @ApiOperation({ summary: 'List active user devices/sessions' })
  @ApiResponse({ status: 200, description: 'List of devices' })
  async listDevices(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ devices: unknown[] }> {
    Logger.log(
      `DeviceManagement: listDevices - User ${user.sub}`,
      'UsersController',
    );
    let devices = await this.usersService.listActiveSessions(user.sub);
    if (!Array.isArray(devices)) {
      devices = [];
    }
    return { devices: devices as unknown[] };
  }

  @Post('devices/:id/revoke')
  @UseGuards(JwtAuthGuard, TenantAuthGuard)
  @ApiOperation({ summary: 'Revoke a device/session by ID' })
  @ApiResponse({ status: 200, description: 'Device revoked' })
  async revokeDevice(
    @CurrentUser() user: JwtPayload,
    @Param('id') sessionId: string,
  ) {
    Logger.log(
      `DeviceManagement: revokeDevice - User ${user.sub}, Session ${sessionId}`,
      'UsersController',
    );
    // Only allow revoking own sessions
    await this.usersService.revokeSession(user.sub, sessionId);
    return { success: true };
  }
}
