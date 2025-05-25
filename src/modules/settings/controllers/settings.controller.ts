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
  
  @Controller('settings')
  @UseGuards(RolesGuard)
  export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}
  
    @Get()
    @Roles('admin')
    async findAll(): Promise<SystemSetting[]> {
      return this.settingsService.findAll();
    }
  
    @Get(':key')
    @Roles('admin')
    async findOne(@Param('key') key: string): Promise<SystemSetting> {
      const setting = await this.settingsService.findByKey(key);
      if (!setting) {
        throw new NotFoundException(`Setting with key ${key} not found`);
      }
      return setting;
    }
  
    @Post()
    @Roles('admin')
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
    async remove(@Param('key') key: string): Promise<{ success: boolean }> {
      const result = await this.settingsService.delete(key);
      return { success: result };
    }
  
    @Get('categories/session')
    @Roles('admin')
    async getSessionSettings() {
      return this.settingsService.getSessionTimeoutSettings();
    }
  
    @Get('categories/authentication')
    @Roles('admin')
    async getAuthSettings() {
      return this.settingsService.getAuthenticationSettings();
    }
  
    @Get('categories/tokens')
    @Roles('admin')
    async getTokenSettings() {
      return this.settingsService.getTokenSettings();
    }
  
    @Post('bulk')
    @Roles('admin')
    async upsertBulkSettings(
      @Body() settings: Array<{ key: string; value: any; type?: string; description?: string }>,
    ): Promise<SystemSetting[]> {
      return this.settingsService.upsertBulkSettings(settings);
    }
  }