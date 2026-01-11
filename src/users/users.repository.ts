import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { User } from '../database/models';

@Injectable()
export class UsersRepository {
  async findById(id: number): Promise<User | undefined> {
    return User.query().findById(id);
  }

  async findByIdForUpdate(trx: Knex.Transaction, id: number): Promise<User | undefined> {
    return User.query(trx).forUpdate().findById(id);
  }

  async updateBalance(trx: Knex.Transaction, id: number, balance: string): Promise<void> {
    await User.query(trx).patch({ balance }).where('id', id);
  }
}
