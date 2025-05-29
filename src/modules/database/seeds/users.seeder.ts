import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';
import { SeederOptions } from './seeder.service';

export async function seedUsers(
  userRepository: Repository<User>,
  options: SeederOptions = {},
) {
  const logger = new Logger('UsersSeeder');
  const usersCount = await userRepository.count();
  if (usersCount === 0 || options.force) {
    if (usersCount > 0 && options.force) {
      logger.log(
        'Force option enabled - seeding users even though users already exist',
      );
    }
    logger.log('Seeding users...');
    const passwordHash = await bcrypt.hash('StrongP@ssw0rd!', 10);
    const adminUser = userRepository.create({
      email: 'admin@example.com',
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      emailVerified: true,
      phoneVerified: true,
      active: true,
    });
    await userRepository.save(adminUser);
    const demoUser = userRepository.create({
      email: 'demo@example.com',
      password: passwordHash,
      firstName: 'Demo',
      lastName: 'User',
      role: 'user',
      emailVerified: true,
      phoneVerified: true,
      active: true,
    });
    await userRepository.save(demoUser);
    logger.log('Users seeded successfully');
  } else {
    logger.log('Users already exist, skipping seeding');
  }
}
