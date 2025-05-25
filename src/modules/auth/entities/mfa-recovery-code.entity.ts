// src/modules/auth/entities/mfa-recovery-code.entity.ts
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
  
  @Entity('mfa_recovery_codes')
  export class MfaRecoveryCode {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    @Index()
    userId: string;
  
    @Column()
    @Index()
    code: string;
  
    @Column({ default: false })
    used: boolean;
  
    @Column({ nullable: true })
    usedAt: Date;
  
    @ManyToOne(() => User, (user) => user.mfaRecoveryCodes)
    @JoinColumn({ name: 'userId' })
    user: User;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }