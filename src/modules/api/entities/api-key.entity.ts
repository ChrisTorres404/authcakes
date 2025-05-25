// src/modules/api/entities/api-key.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  import { Tenant } from '../../tenants/entities/tenant.entity';
  
  @Entity('api_keys')
  export class ApiKey {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    @Index()
    userId: string;
  
    @Column({ nullable: true })
    tenantId: string;
  
    @Column()
    name: string;
  
    @Column({ unique: true })
    @Index()
    key: string;
  
    @Column({ type: 'jsonb', default: '{}' })
    permissions: Record<string, any>;
  
    @Column({ nullable: true })
    expiresAt: Date;
  
    @Column({ default: true })
    active: boolean;
  
    @ManyToOne(() => User, (user) => user.apiKeys)
    @JoinColumn({ name: 'userId' })
    user: User;
  
    @ManyToOne(() => Tenant, (tenant) => tenant.apiKeys, { nullable: true })
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }