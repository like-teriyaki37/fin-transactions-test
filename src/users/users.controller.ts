import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id/balance')
  async getBalance(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getBalance(id);
  }
}
