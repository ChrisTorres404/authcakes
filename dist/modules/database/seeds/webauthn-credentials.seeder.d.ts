import { Repository } from 'typeorm';
import { WebauthnCredential } from '../../auth/entities/webauthn-credential.entity';
import { User } from '../../users/entities/user.entity';
export declare function seedWebauthnCredentials(webauthnCredentialRepository: Repository<WebauthnCredential>, userRepository: Repository<User>): Promise<void>;
