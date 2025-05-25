//src/modules/auth/entities/refresh-token.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Unique,
    Check
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  import { Session } from './session.entity';
  
  @Entity('refresh_tokens')
  @Unique(['token'])
  @Check('"expiresAt" > "createdAt"')
  @Check('("isRevoked" = false) OR ("isRevoked" = true AND "revokedAt" IS NOT NULL)')
  export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE', nullable: false })
    @Index()
    user: User;
  
    @ManyToOne(() => Session, (session) => session.refreshTokens, { onDelete: 'SET NULL', nullable: true })
    session: Session;
  
    @Column({ type: 'text', unique: true })
    @Index()
    token: string;
  
    @Column({ type: 'timestamp', nullable: false })
    @Index()
    expiresAt: Date;
  
    @Column({ default: false })
    @Index()
    isRevoked: boolean;
  
    @Column({ nullable: true, type: 'timestamp' })
    revokedAt: Date;
  
    @Column({ nullable: true, length: 128 })
    revokedBy: string;
  
    @Column({ nullable: true, type: 'text' })
    replacedByToken: string;
  
    @Column({ nullable: true, length: 256 })
    revocationReason: string;
  
    @Column({ nullable: true, length: 256 })
    userAgent: string;
  
    @Column({ nullable: true, length: 64 })
    ipAddress: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }