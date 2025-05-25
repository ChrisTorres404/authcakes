import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddMissingColumnsToUserDevicesTable1685601500000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
