import { Request } from 'express';
import { User } from '../../users/entities/user.entity';

export interface RequestWithUser extends Request {
  user: User & {
    id: string;
    sessionId?: string;
  };
  sessionId?: string; // Session ID for the current request
  userId?: string; // User ID for the current request
  tenantId?: string; // Current tenant ID
  tenantAccess?: string[]; // List of accessible tenant IDs
}
