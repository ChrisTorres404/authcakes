export declare class UserResponseDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    active: boolean;
    emailVerified: boolean;
    avatar?: string;
    phoneNumber?: string;
    phoneVerified?: boolean;
    lastLogin?: Date;
    company?: string;
    department?: string;
    country?: string;
    state?: string;
    address?: string;
    address2?: string;
    city?: string;
    zipCode?: string;
    bio?: string;
    mfaEnabled?: boolean;
    mfaType?: string;
    createdAt: Date;
    updatedAt: Date;
}
