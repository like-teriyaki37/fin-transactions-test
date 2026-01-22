import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { User } from '../database/models';

export interface BalanceUpdateResult {
  success: boolean;
  newBalance: string | null;
}

@Injectable()
export class UsersRepository {
  async findById(id: number): Promise<User | undefined> {
    return User.query().findById(id);
  }

  async findByIdForUpdate(trx: Knex.Transaction, id: number): Promise<User | undefined> {
    return User.query(trx).forUpdate().findById(id);
  }

  /**
   * Atomically updates user balance at DB level to avoid floating point errors.
   * Returns null if user not found or insufficient balance.
   */
  async updateBalanceAtomic(
    trx: Knex.Transaction,
    id: number,
    delta: string,
  ): Promise<BalanceUpdateResult> {
    const result = await trx.raw(
      `UPDATE users
       SET balance = balance + ?::decimal, updated_at = NOW()
       WHERE id = ? AND balance + ?::decimal >= 0
       RETURNING balance`,
      [delta, id, delta],
    );

    if (result.rows.length === 0) {
      return { success: false, newBalance: null };
    }

    return { success: true, newBalance: result.rows[0].balance };
  }
}
