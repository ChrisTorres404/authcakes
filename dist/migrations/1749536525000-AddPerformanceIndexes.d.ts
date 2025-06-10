import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddPerformanceIndexes1749536525000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
