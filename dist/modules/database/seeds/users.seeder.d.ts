import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
export declare function seedUsers(userRepository: Repository<User>): Promise<void>;
