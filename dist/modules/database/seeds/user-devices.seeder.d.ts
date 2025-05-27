import { Repository } from 'typeorm';
import { UserDevice } from '../../auth/entities/user-device.entity';
import { User } from '../../users/entities/user.entity';
import { SeederOptions } from './seeder.service';
export declare function seedUserDevices(userDeviceRepository: Repository<UserDevice>, userRepository: Repository<User>, options?: SeederOptions): Promise<void>;
