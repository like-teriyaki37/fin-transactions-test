import { Model } from 'objection';
import { BaseModel } from './base.model';
import { User } from './user.model';
import { TransactionType } from '../../common/constants';

export class Transaction extends BaseModel {
  static tableName = 'transactions';

  transactionId!: string;
  userId!: number;
  externalId!: string;
  providerId!: string;
  type!: TransactionType;
  amount!: string;

  user?: User;

  static get idColumn() {
    return 'transactionId';
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'transactions.user_id',
          to: 'users.id',
        },
      },
    };
  }
}
