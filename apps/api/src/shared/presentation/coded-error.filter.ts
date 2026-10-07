import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { CodedError, type ErrorCategory } from '../errors/coded-error';
import {
  CORRELATION_ID_HEADER,
  type CorrelatedRequest,
} from './correlation-id.middleware';

/**
 * The only place a category becomes an HTTP status. Adding a failure therefore never means
 * editing this map; adding a category is a deliberate change to it.
 */
const STATUS_BY_CATEGORY: Readonly<Record<ErrorCategory, HttpStatus>> = {
  validation: HttpStatus.BAD_REQUEST,
  unauthenticated: HttpStatus.UNAUTHORIZED,
  not_found: HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
  forbidden: HttpStatus.FORBIDDEN,
};

/** The one response shape every client parses, whatever went wrong. */
interface ErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly correlationId: string;
    readonly details?: unknown;
  };
}

/**
 * Failures become responses here and nowhere else, which is what lets everything below a
 * controller throw a plain error and stay unaware of HTTP.
 */
@Catch()
export class CodedErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(CodedErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const correlationId =
      context.getRequest<CorrelatedRequest>().correlationId ??
      (response.getHeader(CORRELATION_ID_HEADER) as string | undefined) ??
      'unknown';

    const { status, body } = this.translate(exception, correlationId);
    response.status(status).json(body);
  }

  private translate(
    exception: unknown,
    correlationId: string,
  ): { status: HttpStatus; body: ErrorBody } {
    if (exception instanceof CodedError) {
      return {
        status: STATUS_BY_CATEGORY[exception.category],
        body: {
          error: {
            code: exception.code,
            message: exception.message,
            correlationId,
          },
        },
      };
    }

    if (exception instanceof ZodValidationException) {
      // `getZodError()` is typed as `unknown`, so the issues are reached by narrowing
      // rather than by an assertion the compiler could not check.
      const zodError = exception.getZodError();

      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          error: {
            code: 'REQUEST_INVALID',
            message: 'The request did not match the expected shape.',
            correlationId,
            ...(zodError instanceof ZodError
              ? { details: zodError.issues }
              : {}),
          },
        },
      };
    }

    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        body: {
          error: {
            code: httpCodeOf(exception.getStatus()),
            message: exception.message,
            correlationId,
          },
        },
      };
    }

    // An unexpected failure is logged in full and answered with a generic body: a stack,
    // a driver message or a file path tells an attacker about the inside of the system,
    // and tells the caller nothing they can act on. The id is what connects the two.
    this.logger.error(
      `Unhandled exception [${correlationId}]`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        error: {
          code: 'INTERNAL_ERROR',
          message:
            'Something went wrong. Quote the correlation id when reporting this.',
          correlationId,
        },
      },
    };
  }
}

function httpCodeOf(status: number): string {
  return status === HttpStatus.NOT_FOUND ? 'NOT_FOUND' : `HTTP_${status}`;
}
