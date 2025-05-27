import { Repository } from 'typeorm';
import { UserDevice } from '../../auth/entities/user-device.entity';
import { User } from '../../users/entities/user.entity';
import { Logger } from '@nestjs/common';
import { SeederOptions } from './seeder.service';

export async function seedUserDevices(
  userDeviceRepository: Repository<UserDevice>,
  userRepository: Repository<User>,
  options: SeederOptions = {},
) {
  const logger = new Logger('UserDevicesSeeder');
  const count = await userDeviceRepository.count();
  if (count === 0 || options.force) {
    if (count > 0 && options.force) {
      logger.log('Force option enabled - seeding user devices even though devices already exist');
    }
    logger.log('Seeding user devices...');
    const adminUser = await userRepository.findOne({ where: { email: 'admin@example.com' } });
    if (adminUser) {
      const device = userDeviceRepository.create({
        userId: adminUser.id,
        deviceId: 'admin-device-1',
        deviceType: 'laptop',
        lastLogin: new Date(),
        trusted: true,
      });
      await userDeviceRepository.save(device);
      logger.log('User device seeded for admin user');
    } else {
      logger.warn('Admin user not found, skipping user devices seeding');
    }
  } else {
    logger.log('User devices already exist, skipping seeding');
  }
}
