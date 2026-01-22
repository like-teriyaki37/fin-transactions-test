import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { KNEX_CONNECTION } from '@willsoto/nestjs-objection';
import { Knex } from 'knex';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../users';
import { TransactionsRepository } from '../transactions';
import { InsufficientBalanceException } from '../common/exceptions';
import { TransactionType, PgErrorCodes } from '../common/constants';
import { WebhookTransactionDto, WebhookResponseDto } from './dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly statementTimeout: number;
  private readonly lockTimeout: number;

  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
    private readonly transactionsRepository: TransactionsRepository,
  ) {
    this.statementTimeout = this.configService.get<number>('database.statementTimeout', 200);
    this.lockTimeout = this.configService.get<number>('database.lockTimeout', 100);
  }

  async handleWebhook(dto: WebhookTransactionDto): Promise<WebhookResponseDto> {
    this.logger.debug(
      `Processing webhook: providerId=${dto.providerId}, externalId=${dto.externalId}, userId=${dto.userId}, type=${dto.type}, amount=${dto.amount}`,
    );

    const trx = await this.knex.transaction();

    try {
      // Set isolation level and timeouts
      await trx.raw('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
      await trx.raw(`SET LOCAL statement_timeout = '${this.statementTimeout}ms'`);
      await trx.raw(`SET LOCAL lock_timeout = '${this.lockTimeout}ms'`);

      // First, lock the user row to ensure they exist and get current balance
      this.logger.debug(`Acquiring lock on user ${dto.userId}`);
      const user = await this.usersRepository.findByIdForUpdate(trx, dto.userId);

      if (!user) {
        this.logger.debug(`User ${dto.userId} not found`);
        throw new NotFoundException(`User ${dto.userId} not found`);
      }

      this.logger.debug('Attempting to insert transaction');

      try {
        const newTransaction = await this.transactionsRepository.insert(trx, {
          userId: dto.userId,
          externalId: dto.externalId,
          providerId: dto.providerId,
          type: dto.type,
          amount: dto.amount.toFixed(2),
        });

        this.logger.debug(`Transaction inserted: transactionId=${newTransaction.transactionId}`);

        // Calculate delta for DB-level arithmetic (avoids floating point errors)
        const delta = dto.type === TransactionType.CREDIT
          ? dto.amount.toFixed(2)
          : (-dto.amount).toFixed(2);

        this.logger.debug(`Updating balance atomically: userId=${dto.userId}, delta=${delta}`);

        const updateResult = await this.usersRepository.updateBalanceAtomic(trx, dto.userId, delta);

        if (!updateResult.success) {
          this.logger.debug(
            `Insufficient balance: required=${dto.amount}, available=${user.balance}`,
          );
          throw new InsufficientBalanceException();
        }

        const newBalance = parseFloat(updateResult.newBalance!);

        await trx.commit();

        this.logger.debug(
          `Transaction completed: transactionId=${newTransaction.transactionId}, newBalance=${newBalance}`,
        );

        return {
          transactionId: newTransaction.transactionId,
          userId: dto.userId,
          balance: newBalance,
          isProcessed: true,
        };
      } catch (error) {
        // Check for unique constraint violation (duplicate transaction)
        if (error instanceof Error && 'code' in error && (error as { code: string }).code === PgErrorCodes.UNIQUE_VIOLATION) {
          this.logger.debug('Duplicate transaction detected');

          // Rollback the aborted transaction
          await trx.rollback();

          // Fetch existing transaction and current user balance outside transaction
          const existing = await this.transactionsRepository.findByProviderAndExternalId(
            dto.providerId,
            dto.externalId,
          );

          const currentUser = await this.usersRepository.findById(dto.userId);
          const balance = parseFloat(currentUser?.balance ?? '0');

          this.logger.debug(`Returning duplicate response: transactionId=${existing?.transactionId}`);

          return {
            transactionId: existing!.transactionId,
            userId: dto.userId,
            balance,
            isProcessed: false,
            message: 'Transaction already processed',
          };
        }
        throw error;
      }
    } catch (error) {
      // Only rollback if transaction is still active
      if (!trx.isCompleted()) {
        await trx.rollback();
      }
      throw error;
    }
  }
}
