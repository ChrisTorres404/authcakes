import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RefreshToken } from './refresh-token.entity';

@Entity('sessions')
@Check('"expiresAt" > "createdAt"')
@Check('("revoked" = false) OR ("revoked" = true AND "revokedAt" IS NOT NULL)')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.sessions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @Index()
  user: User;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.session)
  refreshTokens: RefreshToken[];

  @Column({ nullable: true, length: 64 })
  ipAddress: string;

  @Column({ nullable: true, length: 256 })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  deviceInfo: Record<string, any>;

  @Column({ type: 'timestamp', nullable: false })
  @Index()
  expiresAt: Date;

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @Column({ default: false })
  @Index()
  revoked: boolean;

  @Column({ nullable: true, type: 'timestamp', default: null })
  revokedAt: Date;

  @Column({ nullable: true, type: 'timestamp', default: null })
  lastUsedAt: Date;

  @Column({ type: 'varchar', nullable: true, length: 128, default: null })
  revokedBy: string;

  @Column({ type: 'timestamp', nullable: true, default: null })
  lastActivityAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
