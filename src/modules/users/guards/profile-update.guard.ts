import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SettingsService } from '../../settings/services/settings.service';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { User } from '../entities/user.entity';

interface RequestWithUser extends Request {
  user?: User;
  body: Record<string, unknown>;
}

@Injectable()
export class ProfileUpdateGuard implements CanActivate {
  constructor(
    private readonly settingsService: SettingsService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get request object with proper typing
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const updatedFields = Object.keys(request.body);

    // Skip check for admin users if they're using a different endpoint
    const isAdminRoute = this.reflector.get<boolean>(
      'isAdminRoute',
      context.getHandler(),
    );
    if (isAdminRoute && request.user && request.user.role === 'admin') {
      return true;
    }

    // Check if profile updates are allowed at all
    const allowProfileUpdate = await this.settingsService.getValue<boolean>(
      'ALLOW_USER_PROFILE_UPDATE',
      true,
    );

    if (!allowProfileUpdate) {
      throw new ForbiddenException('Profile updates are not allowed');
    }

    // Get allowed fields from settings
    const allowedFields = await this.settingsService.getValue<string[]>(
      'PROFILE_UPDATABLE_FIELDS',
      [
        'firstName',
        'lastName',
        'avatar',
        'company',
        'department',
        'country',
        'state',
        'address',
        'address2',
        'city',
        'zipCode',
        'bio',
      ],
    );

    // Check if user is trying to update fields they're not allowed to
    const unauthorizedFields = updatedFields.filter(
      (field) => !allowedFields.includes(field),
    );

    if (unauthorizedFields.length > 0) {
      throw new ForbiddenException(
        `You are not allowed to update the following fields: ${unauthorizedFields.join(', ')}`,
      );
    }

    return true;
  }
}
