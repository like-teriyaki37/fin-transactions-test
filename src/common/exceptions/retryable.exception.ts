import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../constants/error-codes';

export class RetryableException extends HttpException {
  constructor(message?: string) {
    super(
      {
        code: ErrorCodes.ERROR_RETRY,
        message: message || 'Service temporarily unavailable, please retry',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
