import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateWebauthnCredentialsTable1685600700000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
