import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SeederOptions } from './seeder.service';
export declare function seedUsers(userRepository: Repository<User>, options?: SeederOptions): Promise<void>;
