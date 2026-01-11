import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TransactionService } from '../database/transaction.service';
import { UsersRepository } from '../users';
import { TransactionsRepository } from '../transactions';
import { InsufficientBalanceException } from '../common/exceptions';
import { TransactionType } from '../common/constants';
import { WebhookTransactionDto, WebhookResponseDto } from './dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly transactionService: TransactionService,
    private readonly usersRepository: UsersRepository,
    private readonly transactionsRepository: TransactionsRepository,
  ) { }

  async handleWebhook(dto: WebhookTransactionDto): Promise<WebhookResponseDto> {
    this.logger.debug(
      `Processing webhook: providerId=${dto.providerId}, externalId=${dto.externalId}, userId=${dto.userId}, type=${dto.type}, amount=${dto.amount}`,
    );

    return this.transactionService.withTransaction(async (trx) => {
      this.logger.debug('Attempting to insert transaction');
      const newTransaction = await this.transactionsRepository.insertWithConflict(
        trx,
        {
          userId: dto.userId,
          externalId: dto.externalId,
          providerId: dto.providerId,
          type: dto.type,
          amount: dto.amount.toFixed(2),
        },
      );

      if (!newTransaction) {
        this.logger.debug('Duplicate transaction detected, fetching existing');
        const existing = await this.transactionsRepository.findByProviderAndExternalId(
          trx,
          dto.providerId,
          dto.externalId,
        );

        const user = await this.usersRepository.findByIdForUpdate(trx, dto.userId);
        const balance = parseFloat(user?.balance ?? '0');

        this.logger.debug(
          `Returning duplicate response: transactionId=${existing!.transactionId}`,
        );
        return {
          transactionId: existing!.transactionId,
          userId: dto.userId,
          balance,
          isProcessed: false,
          message: 'Transaction already processed',
        };
      }

      this.logger.debug(
        `Transaction inserted: transactionId=${newTransaction.transactionId}`,
      );

      this.logger.debug(`Acquiring lock on user ${dto.userId}`);
      const user = await this.usersRepository.findByIdForUpdate(trx, dto.userId);

      if (!user) {
        this.logger.debug(`User ${dto.userId} not found`);
        throw new NotFoundException(`User ${dto.userId} not found`);
      }

      const currentBalance = parseFloat(user.balance);
      const amount = dto.amount;
      const balanceChange = dto.type === TransactionType.CREDIT ? amount : -amount;
      const newBalance = currentBalance + balanceChange;

      this.logger.debug(
        `Balance calculation: current=${currentBalance}, change=${balanceChange}, new=${newBalance}`,
      );

      if (newBalance < 0) {
        this.logger.debug(
          `Insufficient balance: required=${amount}, available=${currentBalance}`,
        );
        throw new InsufficientBalanceException();
      }

      this.logger.debug(`Updating user ${dto.userId} balance to ${newBalance}`);
      await this.usersRepository.updateBalance(trx, dto.userId, newBalance.toFixed(2));

      this.logger.debug(
        `Transaction completed: transactionId=${newTransaction.transactionId}, newBalance=${newBalance}`,
      );
      return {
        transactionId: newTransaction.transactionId,
        userId: dto.userId,
        balance: newBalance,
        isProcessed: true,
      };
    });
  }
}
