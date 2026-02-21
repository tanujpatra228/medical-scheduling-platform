import { DataSource, DataSourceOptions } from "typeorm";
import path from "path";

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  logging: boolean;
}

export function createDataSourceOptions(config: DatabaseConfig): DataSourceOptions {
  return {
    type: "postgres",
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    logging: config.logging,
    entities: [path.join(__dirname, "entities", "*.entity.{ts,js}")],
    migrations: [path.join(__dirname, "migrations", "*.{ts,js}")],
    synchronize: false,
    poolSize: 20,
  };
}

export function createDataSource(config: DatabaseConfig): DataSource {
  return new DataSource(createDataSourceOptions(config));
}
