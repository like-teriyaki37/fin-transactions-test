import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { plainToInstance } from 'class-transformer';
import { Transaction } from '../database/models';
import { TransactionType } from '../common/constants';
import { GetTransactionsDto } from './dto/get-transactions.dto';

@Injectable()
export class TransactionsRepository {
  async findAll(filters: GetTransactionsDto): Promise<Transaction[]> {
    const query = Transaction.query()
      .orderBy('createdAt', 'desc')
      .limit(filters.limit ?? 10)
      .offset(filters.offset ?? 0);

    if (filters.userId) {
      query.where('userId', filters.userId);
    }

    if (filters.startDate) {
      query.where('createdAt', '>=', filters.startDate);
    }

    if (filters.endDate) {
      query.where('createdAt', '<=', filters.endDate);
    }

    return query;
  }

  async findByProviderAndExternalId(
    providerId: string,
    externalId: string,
  ): Promise<Transaction | undefined> {
    return Transaction.query()
      .where('providerId', providerId)
      .where('externalId', externalId)
      .first();
  }

  /**
   * Insert transaction. Throws unique constraint violation (23505) on duplicate.
   */
  async insert(
    trx: Knex.Transaction,
    data: {
      userId: number;
      externalId: string;
      providerId: string;
      type: TransactionType;
      amount: string;
    },
  ): Promise<Transaction> {
    const { userId, externalId, providerId, type, amount } = data;
    const result = await trx.raw(
      `INSERT INTO transactions (user_id, external_id, provider_id, type, amount)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`,
      [userId, externalId, providerId, type, amount],
    );

    return this.mapRowToTransaction(result.rows[0]);
  }

  private mapRowToTransaction(row: Record<string, unknown>): Transaction {
    return plainToInstance(Transaction, {
      transactionId: row.transaction_id,
      userId: row.user_id,
      externalId: row.external_id,
      providerId: row.provider_id,
      type: row.type,
      amount: row.amount,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
