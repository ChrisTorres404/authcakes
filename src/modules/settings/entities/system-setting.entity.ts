// src/modules/settings/entities/system-setting.entity.ts
import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryColumn
  } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
  
  @Entity('system_settings')
  export class SystemSetting {
    @ApiProperty({ example: 'siteName' })
    @PrimaryColumn()
    key: string;
  
    @ApiProperty({ example: 'My App' })
    @Column({ type: 'text' })
    value: string;
  
    @ApiProperty({ example: 'string', default: 'string' })
    @Column({ default: 'string' })
    type: string;
  
    @ApiProperty({ example: 'The name of the site', required: false })
    @Column({ nullable: true })
    description: string;
  
    @ApiProperty({ type: String, format: 'date-time', example: '2024-06-01T12:00:00Z' })
    @CreateDateColumn()
    createdAt: Date;
  
    @ApiProperty({ type: String, format: 'date-time', example: '2024-06-01T12:00:00Z' })
    @UpdateDateColumn()
    updatedAt: Date;
  }