import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TYPE transaction_type AS ENUM ('debit', 'credit')
  `);

  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.decimal('balance', 19, 2).notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('transactions', (table) => {
    table.uuid('transaction_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.string('external_id', 255).notNullable();
    table.string('provider_id', 255).notNullable();
    table.specificType('type', 'transaction_type').notNullable();
    table.decimal('amount', 19, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['provider_id', 'external_id']);

    table.index(['user_id'], 'idx_transactions_user_id', { storageEngineIndexType: 'hash' });
    table.index(['created_at'], 'idx_transactions_created_at');
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('users');
  await knex.raw('DROP TYPE IF EXISTS transaction_type');
}

