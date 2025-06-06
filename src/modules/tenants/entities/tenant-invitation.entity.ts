import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tenant } from './tenant.entity';
import { TenantRole } from '../dto/tenant-invitation.dto';

@Entity('tenant_invitations')
export class TenantInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  invitedBy: string;

  @Column()
  @Index()
  email: string;

  @Column({ type: 'varchar', default: TenantRole.MEMBER })
  role: TenantRole;

  @Column({ unique: true })
  @Index()
  token: string;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  acceptedAt: Date;

  @Column({ nullable: true })
  acceptedBy: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.invitations)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invitedBy' })
  inviter: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'acceptedBy' })
  acceptor: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
