import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../constants/error-codes';

export class InsufficientBalanceException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCodes.ERROR_INSUFFICIENT_BALANCE,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
