import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddMissingOtpColumnsToUsers1748322700000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
