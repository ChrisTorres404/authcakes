// src/modules/settings/controllers/settings.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    NotFoundException,
  } from '@nestjs/common';
  import { SettingsService } from '../services/settings.service';
  import { SystemSetting } from '../entities/system-setting.entity';
  import { CreateSettingDto } from '../dto/create-setting.dto';
  import { UpdateSettingDto } from '../dto/update-setting.dto';
  import { Roles } from '../../../common/decorators/roles.decorator';
  import { RolesGuard } from '../../../common/guards/roles.guard';
  import { ApiOperation, ApiOkResponse, ApiBody, ApiNotFoundResponse, ApiBadRequestResponse, ApiTags } from '@nestjs/swagger';
  import { SessionSettingsDto } from '../dto/session-settings.dto';
  import { AuthSettingsDto } from '../dto/auth-settings.dto';
  import { TokenSettingsDto } from '../dto/token-settings.dto';
  import { BulkSettingDto } from '../dto/bulk-setting.dto';
  
  @ApiTags('Settings')
  @Controller('settings')
  @UseGuards(RolesGuard)
  export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}
  
    @Get()
    @Roles('admin')
    @ApiOperation({ summary: 'Get all system settings.' })
    @ApiOkResponse({ type: [SystemSetting], description: 'List of all system settings.' })
    async findAll(): Promise<SystemSetting[]> {
      return this.settingsService.findAll();
    }
  
    @Get(':key')
    @Roles('admin')
    @ApiOperation({ summary: 'Get a system setting by key.' })
    @ApiOkResponse({ type: SystemSetting, description: 'The system setting.' })
    @ApiNotFoundResponse({ description: 'Setting with key not found.' })
    async findOne(@Param('key') key: string): Promise<SystemSetting> {
      const setting = await this.settingsService.findByKey(key);
      if (!setting) {
        throw new NotFoundException(`Setting with key ${key} not found`);
      }
      return setting;
    }
  
    @Post()
    @Roles('admin')
    @ApiOperation({ summary: 'Create a new system setting.' })
    @ApiBody({ type: CreateSettingDto })
    @ApiOkResponse({ type: SystemSetting, description: 'The created system setting.' })
    @ApiBadRequestResponse({ description: 'Invalid input.' })
    async create(@Body() createSettingDto: CreateSettingDto): Promise<SystemSetting> {
      return this.settingsService.setValue(
        createSettingDto.key,
        createSettingDto.value,
        createSettingDto.type,
        createSettingDto.description,
      );
    }
  
    @Post(':key')
    @Roles('admin')
    @ApiOperation({ summary: 'Update a system setting by key.' })
    @ApiBody({ type: UpdateSettingDto })
    @ApiOkResponse({ type: SystemSetting, description: 'The updated system setting.' })
    @ApiBadRequestResponse({ description: 'Invalid input.' })
    @ApiNotFoundResponse({ description: 'Setting with key not found.' })
    async update(
      @Param('key') key: string,
      @Body() updateSettingDto: UpdateSettingDto,
    ): Promise<SystemSetting> {
      return this.settingsService.setValue(
        key,
        updateSettingDto.value,
        updateSettingDto.type,
        updateSettingDto.description,
      );
    }
  
    @Delete(':key')
    @Roles('admin')
    @ApiOperation({ summary: 'Delete a system setting by key.' })
    @ApiOkResponse({ schema: { example: { success: true } }, description: 'Setting deleted.' })
    @ApiNotFoundResponse({ description: 'Setting with key not found.' })
    async remove(@Param('key') key: string): Promise<{ success: boolean }> {
      const result = await this.settingsService.delete(key);
      return { success: result };
    }
  
    @Get('categories/session')
    @Roles('admin')
    @ApiOperation({ summary: 'Get session timeout settings.' })
    @ApiOkResponse({ type: SessionSettingsDto, description: 'Session timeout settings.' })
    async getSessionSettings() {
      return this.settingsService.getSessionTimeoutSettings();
    }
  
    @Get('categories/authentication')
    @Roles('admin')
    @ApiOperation({ summary: 'Get authentication settings.' })
    @ApiOkResponse({ type: AuthSettingsDto, description: 'Authentication settings.' })
    async getAuthSettings() {
      return this.settingsService.getAuthenticationSettings();
    }
  
    @Get('categories/tokens')
    @Roles('admin')
    @ApiOperation({ summary: 'Get token settings.' })
    @ApiOkResponse({ type: TokenSettingsDto, description: 'Token settings.' })
    async getTokenSettings() {
      return this.settingsService.getTokenSettings();
    }
  
    @Post('bulk')
    @Roles('admin')
    @ApiOperation({ summary: 'Upsert multiple system settings in bulk.' })
    @ApiBody({ type: [BulkSettingDto] })
    @ApiOkResponse({ type: [SystemSetting], description: 'The upserted system settings.' })
    @ApiBadRequestResponse({ description: 'Invalid input.' })
    async upsertBulkSettings(
      @Body() settings: BulkSettingDto[],
    ): Promise<SystemSetting[]> {
      return this.settingsService.upsertBulkSettings(settings);
    }
  }