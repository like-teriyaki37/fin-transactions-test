import { Model } from 'objection';
import { BaseModel } from './base.model';
import { Transaction } from './transaction.model';

export class User extends BaseModel {
  static tableName = 'users';

  id!: number;
  name!: string;
  balance!: string;

  transactions?: Transaction[];

  static get relationMappings() {
    return {
      transactions: {
        relation: Model.HasManyRelation,
        modelClass: Transaction,
        join: {
          from: 'users.id',
          to: 'transactions.user_id',
        },
      },
    };
  }
}
