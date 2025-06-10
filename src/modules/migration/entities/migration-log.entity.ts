import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum MigrationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

export enum MigrationType {
  LOOKUP_DATA = 'lookup_data',
  USERS = 'users',
  TENANTS = 'tenants',
  SECURITY = 'security',
  SESSIONS = 'sessions',
  API_KEYS = 'api_keys',
  SETTINGS = 'settings',
  FULL = 'full',
}

@Entity('migration_logs')
@Index(['type', 'status'])
@Index(['startedAt'])
export class MigrationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MigrationType,
  })
  type: MigrationType;

  @Column({
    type: 'enum',
    enum: MigrationStatus,
    default: MigrationStatus.PENDING,
  })
  status: MigrationStatus;

  @Column({ type: 'integer', default: 0 })
  totalRecords: number;

  @Column({ type: 'integer', default: 0 })
  processedRecords: number;

  @Column({ type: 'integer', default: 0 })
  failedRecords: number;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'integer', nullable: true })
  durationSeconds: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  errorDetails: Record<string, any>;

  @Column({ type: 'varchar', length: 255 })
  executedBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  checkpointId: string;

  // Helper methods
  markInProgress(): void {
    this.status = MigrationStatus.IN_PROGRESS;
  }

  markCompleted(): void {
    this.status = MigrationStatus.COMPLETED;
    this.completedAt = new Date();
    if (this.startedAt) {
      this.durationSeconds = Math.floor(
        (this.completedAt.getTime() - this.startedAt.getTime()) / 1000
      );
    }
  }

  markFailed(error: Error): void {
    this.status = MigrationStatus.FAILED;
    this.completedAt = new Date();
    this.errorMessage = error.message;
    this.errorDetails = {
      stack: error.stack,
      name: error.name,
    };
    if (this.startedAt) {
      this.durationSeconds = Math.floor(
        (this.completedAt.getTime() - this.startedAt.getTime()) / 1000
      );
    }
  }

  updateProgress(processed: number, failed: number = 0): void {
    this.processedRecords = processed;
    this.failedRecords = failed;
  }

  getSuccessRate(): number {
    if (this.processedRecords === 0) return 0;
    return ((this.processedRecords - this.failedRecords) / this.processedRecords) * 100;
  }
}