import { CanActivate, ExecutionContext } from '@nestjs/common';
import { SettingsService } from '../../settings/services/settings.service';
import { Reflector } from '@nestjs/core';
export declare class ProfileUpdateGuard implements CanActivate {
    private readonly settingsService;
    private reflector;
    constructor(settingsService: SettingsService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
