import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
export declare const dataSourceOptions: PostgresConnectionOptions;
declare const dataSource: DataSource;
export default dataSource;
