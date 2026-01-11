import { Controller, Get, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { GetTransactionsDto } from './dto/get-transactions.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async findAll(@Query() query: GetTransactionsDto) {
    return this.transactionsService.findAll(query);
  }
}
