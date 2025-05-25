"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePasswordHistoryTable1748069000000 = void 0;
const typeorm_1 = require("typeorm");
class CreatePasswordHistoryTable1748069000000 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
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
        }), true);
        await queryRunner.createIndex('password_history', new typeorm_1.TableIndex({
            name: 'IDX_PASSWORD_HISTORY_USER_ID',
            columnNames: ['userId'],
        }));
        await queryRunner.createForeignKey('password_history', new typeorm_1.TableForeignKey({
            name: 'FK_PASSWORD_HISTORY_USER_ID',
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropForeignKey('password_history', 'FK_PASSWORD_HISTORY_USER_ID');
        await queryRunner.dropIndex('password_history', 'IDX_PASSWORD_HISTORY_USER_ID');
        await queryRunner.dropTable('password_history');
    }
}
exports.CreatePasswordHistoryTable1748069000000 = CreatePasswordHistoryTable1748069000000;
//# sourceMappingURL=1748069000000-CreatePasswordHistoryTable.js.map