//src/modules/tenants/entities/tenant.entity.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    DeleteDateColumn
  } from 'typeorm';
  import { TenantMembership } from './tenant-membership.entity';
  import { ApiKey } from '../../api/entities/api-key.entity';
  import { TenantInvitation } from './tenant-invitation.entity';
  import { Log } from '../../logs/entities/log.entity';
  
  @Entity('tenants')
  export class Tenant {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    name: string;
  
    @Column({ unique: true })
    slug: string;
  
    @Column({ nullable: true })
    logo: string;
  
    @Column({ default: true })
    active: boolean;
  
    @Column({ type: 'jsonb', nullable: true })
    settings: Record<string, any>;
  
    // Relationships
    @OneToMany(() => TenantMembership, (membership) => membership.tenant)
    memberships: TenantMembership[];
  
    @OneToMany(() => ApiKey, (apiKey) => apiKey.tenant)
    apiKeys: ApiKey[];
  
    @OneToMany(() => TenantInvitation, (invitation) => invitation.tenant)
    invitations: TenantInvitation[];
  
    @OneToMany(() => Log, (log) => log.tenant)
    logs: Log[];
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;
  }
  