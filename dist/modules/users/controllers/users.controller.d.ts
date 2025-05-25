import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<import("../entities/user.entity").User>;
    findAll(query: any): Promise<import("../entities/user.entity").User[]>;
    getProfile(user: any): Promise<import("../entities/user.entity").User>;
    findOne(id: string): Promise<import("../entities/user.entity").User>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<import("../entities/user.entity").User>;
    updateProfile(user: any, updateUserDto: UpdateUserDto): Promise<import("../entities/user.entity").User>;
    remove(id: string): Promise<void>;
    verifyEmail(token: string): Promise<import("../entities/user.entity").User>;
    verifyPhone(token: string): Promise<import("../entities/user.entity").User>;
    listDevices(user: any): Promise<{
        devices: import("../../auth/entities/session.entity").Session[];
    }>;
    revokeDevice(user: any, sessionId: string): Promise<{
        success: boolean;
    }>;
}
