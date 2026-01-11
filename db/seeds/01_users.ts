import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('transactions').del();
  await knex('users').del();

  const users = Array.from({ length: 1000 }, (_, i) => ({
    name: `User ${i + 1}`,
    balance: 10000.0,
  }));

  const batchSize = 100;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    await knex('users').insert(batch);
  }
}
