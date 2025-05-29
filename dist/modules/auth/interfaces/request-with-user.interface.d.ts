import { Request } from 'express';
import { User } from '../../users/entities/user.entity';
export interface RequestWithUser extends Request {
    user: User & {
        id: string;
        sessionId?: string;
    };
    sessionId?: string;
    userId?: string;
    tenantId?: string;
    tenantAccess?: string[];
}
