// src/modules/auth/entities/webauthn-credential.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Unique
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  
  @Entity('webauthn_credentials')
  @Unique(['userId', 'credentialId'])
  export class WebauthnCredential {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    @Index()
    userId: string;
  
    @Column()
    @Index()
    credentialId: string;
  
    @Column({ type: 'text' })
    publicKey: string;
  
    @Column({ default: 0 })
    counter: number;
  
    @Column({ nullable: true })
    deviceName: string;
  
    @ManyToOne(() => User, (user) => user.webauthnCredentials)
    @JoinColumn({ name: 'userId' })
    user: User;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }