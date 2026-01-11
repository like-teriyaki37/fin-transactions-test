import type { Knex } from 'knex';
import * as dotenv from 'dotenv';

dotenv.config();

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  },
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
  seeds: {
    directory: './seeds',
    extension: 'ts',
  },
};

export default config;
