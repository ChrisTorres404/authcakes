import { Repository } from 'typeorm';
export interface SeederOptions {
    force?: boolean;
}
import { SystemSetting } from '../../settings/entities/system-setting.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantMembership } from '../../tenants/entities/tenant-membership.entity';
import { Log } from '../../logs/entities/log.entity';
import { ApiKey } from '../../api/entities/api-key.entity';
import { MfaRecoveryCode } from '../../auth/entities/mfa-recovery-code.entity';
import { WebauthnCredential } from '../../auth/entities/webauthn-credential.entity';
import { UserDevice } from '../../auth/entities/user-device.entity';
import { TenantInvitation } from '../../tenants/entities/tenant-invitation.entity';
export declare class SeederService {
    private readonly systemSettingsRepository;
    private readonly userRepository;
    private readonly tenantRepository;
    private readonly tenantMembershipRepository;
    private readonly logRepository;
    private readonly apiKeyRepository;
    private readonly mfaRecoveryCodeRepository;
    private readonly webauthnCredentialRepository;
    private readonly userDeviceRepository;
    private readonly invitationRepository;
    private readonly logger;
    constructor(systemSettingsRepository: Repository<SystemSetting>, userRepository: Repository<User>, tenantRepository: Repository<Tenant>, tenantMembershipRepository: Repository<TenantMembership>, logRepository: Repository<Log>, apiKeyRepository: Repository<ApiKey>, mfaRecoveryCodeRepository: Repository<MfaRecoveryCode>, webauthnCredentialRepository: Repository<WebauthnCredential>, userDeviceRepository: Repository<UserDevice>, invitationRepository: Repository<TenantInvitation>);
    seed(options?: SeederOptions): Promise<void>;
}
