import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';
import { User } from '../entities/user.entity';
import { UserProfileDto } from '../dto/user-profile.dto';
import { Request } from 'express';
import { UserResponseDto } from '../dto/user-response.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(search?: string): Promise<User[]>;
    getProfile(user: User): Promise<UserProfileDto>;
    updateProfile(user: User, updateUserProfileDto: UpdateUserProfileDto, request: Request & {
        ip: string;
    }): Promise<User>;
    findOne(id: string): Promise<UserResponseDto>;
    update(id: string, updateUserDto: UpdateUserDto, admin: User, request: Request): Promise<User>;
    remove(id: string): Promise<void>;
    verifyEmail(token: string): Promise<User>;
    verifyPhone(token: string): Promise<User>;
    listDevices(user: User): Promise<{
        devices: unknown[];
    }>;
    revokeDevice(user: User, sessionId: string): Promise<{
        success: boolean;
    }>;
}
