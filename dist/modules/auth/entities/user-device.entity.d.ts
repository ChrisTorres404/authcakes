import { User } from '../../users/entities/user.entity';
export declare class UserDevice {
    id: string;
    userId: string;
    deviceId: string;
    deviceType: string;
    ip: string;
    userAgent: string;
    browser: string;
    os: string;
    location: string;
    lastLogin: Date;
    trusted: boolean;
    user: User;
    createdAt: Date;
    updatedAt: Date;
}
