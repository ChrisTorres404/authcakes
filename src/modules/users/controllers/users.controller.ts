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
    HttpCode
  } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { TenantAuthGuard } from '../../../common/guards/tenant-auth.guard';
  
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  @UseGuards(RolesGuard)
  findAll(@Query() query) {
    return this.usersService.search(query);
  }

  @Get('profile')
  getProfile(@CurrentUser() user) {
    return this.usersService.findById(user.id);
  }

  @Get(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(200)
  async verifyEmail(@Body('token') token: string) {
    return this.usersService.verifyEmail(token);
  }

  @Post('verify-phone')
  @Public()
  @HttpCode(200)
  async verifyPhone(@Body('token') token: string) {
    return this.usersService.verifyPhone(token);
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard, TenantAuthGuard)
  async listDevices(@CurrentUser() user) {
    // Audit log
    console.log('[Audit] DeviceManagement: listDevices', { userId: user.id, tenantId: user.tenantId, action: 'listDevices' });
    // List active sessions for the user
    const devices = await this.usersService.listActiveSessions(user.id);
    console.log('[DeviceManagement] Active sessions:', devices);
    return {
      devices
    };
  }

  @Post('devices/:id/revoke')
  @UseGuards(JwtAuthGuard, TenantAuthGuard)
  async revokeDevice(@CurrentUser() user, @Param('id') sessionId: string) {
    console.log('[Audit] DeviceManagement: revokeDevice', { userId: user.id, tenantId: user.tenantId, action: 'revokeDevice', sessionId });
    // Only allow revoking own sessions
    await this.usersService.revokeSession(user.id, sessionId);
    return { success: true };
  }
}