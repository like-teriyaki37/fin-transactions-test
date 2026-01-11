import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
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
    trx: Knex.Transaction,
    providerId: string,
    externalId: string,
  ): Promise<Transaction | undefined> {
    return Transaction.query(trx)
      .where('providerId', providerId)
      .where('externalId', externalId)
      .first();
  }

  async insertWithConflict(
    trx: Knex.Transaction,
    data: {
      userId: number;
      externalId: string;
      providerId: string;
      type: TransactionType;
      amount: string;
    },
  ): Promise<Transaction | null> {
    const { userId, externalId, providerId, type, amount } = data;
    const result = await trx.raw(
      `INSERT INTO transactions (user_id, external_id, provider_id, type, amount)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (provider_id, external_id) DO NOTHING
       RETURNING *`,
      [userId, externalId, providerId, type, amount],
    );

    return result.rows[0] ? this.mapRowToTransaction(result.rows[0]) : null;
  }

  private mapRowToTransaction(row: Record<string, unknown>): Transaction {
    const transaction = new Transaction();
    transaction.transactionId = row.transaction_id as string;
    transaction.userId = row.user_id as number;
    transaction.externalId = row.external_id as string;
    transaction.providerId = row.provider_id as string;
    transaction.type = row.type as TransactionType;
    transaction.amount = row.amount as string;
    transaction.createdAt = row.created_at as Date;
    transaction.updatedAt = row.updated_at as Date;
    return transaction;
  }
}
