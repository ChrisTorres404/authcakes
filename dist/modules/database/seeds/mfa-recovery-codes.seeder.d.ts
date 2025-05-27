import { Repository } from 'typeorm';
import { MfaRecoveryCode } from '../../auth/entities/mfa-recovery-code.entity';
import { User } from '../../users/entities/user.entity';
import { SeederOptions } from './seeder.service';
export declare function seedMfaRecoveryCodes(mfaRecoveryCodeRepository: Repository<MfaRecoveryCode>, userRepository: Repository<User>, options?: SeederOptions): Promise<void>;
