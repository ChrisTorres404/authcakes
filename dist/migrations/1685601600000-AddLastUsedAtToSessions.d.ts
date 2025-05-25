import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddLastUsedAtToSessions1685601600000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
