import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePasswordHistoryTable1748069000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create password_history table
    await queryRunner.createTable(
      new Table({
        name: 'password_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'passwordHash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add index on userId for faster lookups
    await queryRunner.createIndex(
      'password_history',
      new TableIndex({
        name: 'IDX_PASSWORD_HISTORY_USER_ID',
        columnNames: ['userId'],
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'password_history',
      new TableForeignKey({
        name: 'FK_PASSWORD_HISTORY_USER_ID',
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('password_history', 'FK_PASSWORD_HISTORY_USER_ID');
    await queryRunner.dropIndex('password_history', 'IDX_PASSWORD_HISTORY_USER_ID');
    await queryRunner.dropTable('password_history');
  }
}