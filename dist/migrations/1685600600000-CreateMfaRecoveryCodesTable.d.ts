import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateMfaRecoveryCodesTable1685600600000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
