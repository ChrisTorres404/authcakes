// src/modules/settings/entities/system-setting.entity.ts
import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryColumn
  } from 'typeorm';
  
  @Entity('system_settings')
  export class SystemSetting {
    @PrimaryColumn()
    key: string;
  
    @Column({ type: 'text' })
    value: string;
  
    @Column({ default: 'string' })
    type: string;
  
    @Column({ nullable: true })
    description: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }