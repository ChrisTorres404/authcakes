import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum CheckpointType {
  PRE_MIGRATION = 'pre_migration',
  POST_LOOKUP = 'post_lookup',
  POST_USERS = 'post_users',
  POST_TENANTS = 'post_tenants',
  POST_SECURITY = 'post_security',
  FINAL = 'final',
}

@Entity('migration_checkpoints')
@Index(['type', 'isActive'])
@Index(['createdAt'])
export class MigrationCheckpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: CheckpointType,
  })
  type: CheckpointType;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'jsonb' })
  state: {
    // Record counts at this checkpoint
    counts: {
      users: number;
      tenants: number;
      tenant_memberships: number;
      sessions: number;
      api_keys: number;
      system_settings: number;
      // Master schema counts
      account_logins?: number;
      account_users?: number;
      accounts?: number;
      account_management_groups?: number;
      account_management_group_members?: number;
    };
    // Last processed IDs for resuming
    lastProcessedIds: {
      userId?: string;
      tenantId?: string;
      membershipId?: string;
      sessionId?: string;
      apiKeyId?: string;
    };
    // Validation checksums
    checksums: {
      users?: string;
      tenants?: string;
      critical_data?: string;
    };
  };

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  createdBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Helper to create a rollback point
  static createCheckpoint(
    type: CheckpointType,
    state: any,
    createdBy: string,
    description?: string
  ): MigrationCheckpoint {
    const checkpoint = new MigrationCheckpoint();
    checkpoint.type = type;
    checkpoint.state = state;
    checkpoint.createdBy = createdBy;
    checkpoint.description = description;
    checkpoint.isActive = true;
    return checkpoint;
  }

  deactivate(): void {
    this.isActive = false;
  }
}