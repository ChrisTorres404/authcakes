import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddOtpColumnsToUsers1748058940861 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
