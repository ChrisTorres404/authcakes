import { CreateUserDto } from './create-user.dto';
declare const UpdateUserDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateUserDto>>;
export declare class UpdateUserDto extends UpdateUserDto_base {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    role?: string;
    active?: boolean;
    emailVerified?: boolean;
    company?: string;
    department?: string;
    country?: string;
    state?: string;
    address?: string;
    address2?: string;
    city?: string;
    zipCode?: string;
    bio?: string;
}
export {};
