//src/modules/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { TenantMembership } from '../../tenants/entities/tenant-membership.entity';
import { Session } from '../../auth/entities/session.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { ApiKey } from '../../api/entities/api-key.entity';
import { UserDevice } from '../../auth/entities/user-device.entity';
import { MfaRecoveryCode } from '../../auth/entities/mfa-recovery-code.entity';
import { WebauthnCredential } from '../../auth/entities/webauthn-credential.entity';
import { PasswordHistory } from '../../auth/entities/password-history.entity';
import { Log } from '../../logs/entities/log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  emailVerified: boolean;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ default: false })
  phoneVerified: boolean;

  @Column({ nullable: true, type: 'varchar', length: 255, default: null })
  @Exclude()
  emailVerificationToken: string | null;

  @Column({ nullable: true, type: 'varchar', length: 255, default: null })
  @Exclude()
  phoneVerificationToken: string;

  @Column({ nullable: true, type: 'varchar', length: 255, default: null })
  @Exclude()
  resetToken: string | null;

  @Column({ nullable: true, type: 'timestamp', default: null })
  @Exclude()
  resetTokenExpiry: Date | null;

  @Column({ nullable: true, type: 'varchar', length: 10, default: null })
  @Exclude()
  otp: string | null;

  @Column({ nullable: true, type: 'timestamp', default: null })
  @Exclude()
  otpExpiry: Date | null;

  @Column({ nullable: true, type: 'varchar', length: 255, default: null })
  @Exclude()
  accountRecoveryToken: string | null;

  @Column({ nullable: true, type: 'timestamp', default: null })
  @Exclude()
  accountRecoveryTokenExpiry: Date | null;

  @Column({ default: 0 })
  @Exclude()
  failedLoginAttempts: number;

  @Column({ nullable: true, type: 'timestamp', default: null })
  @Exclude()
  lockedUntil: Date | null;

  @Column({ nullable: true, type: 'timestamp', default: null })
  lastLogin: Date;

  // Profile fields
  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  address2: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  // MFA fields
  @Column({ default: false })
  mfaEnabled: boolean;

  @Column({ nullable: true, type: 'varchar', length: 255, default: null })
  @Exclude()
  mfaSecret: string;

  @Column({ nullable: true })
  mfaType: string;

  // Relationships
  @OneToMany(() => TenantMembership, (membership) => membership.user)
  tenantMemberships: TenantMembership[];

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
  apiKeys: ApiKey[];

  @OneToMany(() => UserDevice, (device) => device.user)
  devices: UserDevice[];

  @OneToMany(() => MfaRecoveryCode, (code) => code.user)
  mfaRecoveryCodes: MfaRecoveryCode[];

  @OneToMany(() => WebauthnCredential, (credential) => credential.user)
  webauthnCredentials: WebauthnCredential[];

  @OneToMany(() => PasswordHistory, (passwordHistory) => passwordHistory.user)
  passwordHistory: PasswordHistory[];

  @OneToMany(() => Log, (log) => log.user)
  logs: Log[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
