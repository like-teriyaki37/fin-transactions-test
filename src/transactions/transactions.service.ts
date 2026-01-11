import { Injectable } from '@nestjs/common';
import { TransactionsRepository } from './transactions.repository';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { Transaction } from '../database/models';

@Injectable()
export class TransactionsService {
  constructor(private readonly transactionsRepository: TransactionsRepository) {}

  async findAll(filters: GetTransactionsDto): Promise<Transaction[]> {
    return this.transactionsRepository.findAll(filters);
  }
}
