import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class EnablePgcryptoExtension1685500000000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
