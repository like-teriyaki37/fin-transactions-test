import { Injectable, Logger, Inject } from '@nestjs/common';
import { KNEX_CONNECTION } from '@willsoto/nestjs-objection';
import { Knex } from 'knex';
import { ConfigService } from '@nestjs/config';
import { RetryableException } from '../common/exceptions';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private readonly statementTimeout: number;
  private readonly lockTimeout: number;

  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly configService: ConfigService,
  ) {
    this.statementTimeout = this.configService.get<number>(
      'database.statementTimeout',
      200,
    );
    this.lockTimeout = this.configService.get<number>(
      'database.lockTimeout',
      100,
    );
  }

  async withTransaction<T>(
    callback: (trx: Knex.Transaction) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.knex.transaction(async (trx) => {
        await trx.raw(
          `SET LOCAL statement_timeout = '${this.statementTimeout}ms'`,
        );
        await trx.raw(`SET LOCAL lock_timeout = '${this.lockTimeout}ms'`);

        return callback(trx);
      });
    } catch (error) {
      this.handleTransactionError(error);
      throw error;
    }
  }

  private handleTransactionError(error: unknown): never | void {
    if (error instanceof Error && 'code' in error) {
      const pgError = error as Error & { code: string };

      if (pgError.code === '40P01') {
        this.logger.warn('Deadlock detected');
        throw new RetryableException('Deadlock detected, please retry');
      }

      if (pgError.code === '55P03') {
        this.logger.warn('Lock timeout exceeded');
        throw new RetryableException('Lock timeout, please retry');
      }

      if (pgError.code === '57014') {
        this.logger.warn('Statement timeout exceeded');
        throw new RetryableException('Statement timeout, please retry');
      }
    }
  }
}
