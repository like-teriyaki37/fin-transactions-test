import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ErrorCodes, RETRYABLE_PG_ERRORS } from '../constants';

interface ErrorResponse {
  code: string;
  message?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const { status, errorResponse } = this.buildErrorResponse(exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status}: ${errorResponse.code}`,
      );
    }

    response.status(status).send(errorResponse);
  }

  private buildErrorResponse(exception: unknown): {
    status: number;
    errorResponse: ErrorResponse;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        const errorResponse: ErrorResponse = {
          code: (resp.code as string) || this.getDefaultCode(status),
        };
        if (resp.message) {
          errorResponse.message = resp.message as string;
        }
        return { status, errorResponse };
      }

      return {
        status,
        errorResponse: {
          code: this.getDefaultCode(status),
          message:
            typeof exceptionResponse === 'string'
              ? exceptionResponse
              : undefined,
        },
      };
    }

    if (exception instanceof Error && 'code' in exception) {
      const pgError = exception as Error & { code: string };

      if (RETRYABLE_PG_ERRORS.includes(pgError.code as typeof RETRYABLE_PG_ERRORS[number])) {
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          errorResponse: {
            code: ErrorCodes.ERROR_RETRY,
            message: 'Service temporarily unavailable, please retry',
          },
        };
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorResponse: {
        code: ErrorCodes.ERROR_INTERNAL,
      },
    };
  }

  private getDefaultCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCodes.ERROR_INVALID_INPUT;
      case HttpStatus.NOT_FOUND:
        return ErrorCodes.ERROR_USER_NOT_FOUND;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCodes.ERROR_RETRY;
      default:
        return ErrorCodes.ERROR_INTERNAL;
    }
  }
}
