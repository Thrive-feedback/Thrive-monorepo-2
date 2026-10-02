import { describe, expect, it, mock } from 'bun:test';
import {
  type ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { z } from 'zod';
import {
  ApplicationError,
  DomainError,
  type ErrorCategory,
} from '../errors/coded-error';
import { CodedErrorFilter } from './coded-error.filter';
import type { CorrelatedRequest } from './correlation-id.middleware';

const CORRELATION_ID = '0199a0f0-0000-7000-8000-000000000000';

class WorkspaceNotFound extends ApplicationError {
  readonly code = 'WORKSPACE_NOT_FOUND';
  readonly category: ErrorCategory = 'not_found';

  constructor() {
    super('That Workspace does not exist.');
  }
}

class TooManyOwners extends DomainError {
  readonly code = 'WORKSPACE_ALREADY_HAS_AN_OWNER';
  readonly category: ErrorCategory = 'conflict';

  constructor() {
    super('A Workspace has exactly one Owner.');
  }
}

interface Answered {
  status: number;
  body: {
    error: {
      code: string;
      message: string;
      correlationId: string;
      details?: unknown;
    };
  };
}

function answerTo(exception: unknown): Answered {
  const answered = { status: 0 } as Answered;
  const response = {
    status(code: number) {
      answered.status = code;
      return this;
    },
    json(payload: Answered['body']) {
      answered.body = payload;
    },
    getHeader: () => undefined,
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () =>
        ({ correlationId: CORRELATION_ID }) as CorrelatedRequest,
    }),
  } as unknown as ArgumentsHost;

  new CodedErrorFilter().catch(exception, host);
  return answered;
}

describe('a failure leaving the API', () => {
  it('answers a missing thing as 404 with its own code', () => {
    const answered = answerTo(new WorkspaceNotFound());

    expect(answered.status).toBe(HttpStatus.NOT_FOUND);
    expect(answered.body.error.code).toBe('WORKSPACE_NOT_FOUND');
    expect(answered.body.error.message).toBe('That Workspace does not exist.');
  });

  it('answers a refused business rule as 409, taking the status from the category', () => {
    const answered = answerTo(new TooManyOwners());

    expect(answered.status).toBe(HttpStatus.CONFLICT);
    expect(answered.body.error.code).toBe('WORKSPACE_ALREADY_HAS_AN_OWNER');
  });

  it('answers a malformed request as 400, with the offending fields as details', () => {
    const zodError = z.object({ email: z.string() }).safeParse({}).error;
    if (zodError === undefined)
      throw new Error('expected a validation failure');

    const answered = answerTo(new ZodValidationException(zodError));

    expect(answered.status).toBe(HttpStatus.BAD_REQUEST);
    expect(answered.body.error.code).toBe('REQUEST_INVALID');
    expect(answered.body.error.details).toEqual(zodError.issues);
  });

  it('keeps the status a framework exception chose', () => {
    const answered = answerTo(new HttpException('Nope', HttpStatus.NOT_FOUND));

    expect(answered.status).toBe(HttpStatus.NOT_FOUND);
    expect(answered.body.error.code).toBe('NOT_FOUND');
  });

  it('answers an unexpected failure generically, telling the caller nothing internal', () => {
    const logged = mock();
    const restore = Logger.prototype.error;
    Logger.prototype.error = logged;

    try {
      const answered = answerTo(
        new Error('connect ECONNREFUSED 127.0.0.1:54329'),
      );

      expect(answered.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(answered.body.error.code).toBe('INTERNAL_ERROR');
      expect(JSON.stringify(answered.body)).not.toContain('ECONNREFUSED');
      expect(logged).toHaveBeenCalled();
    } finally {
      Logger.prototype.error = restore;
    }
  });

  it('carries the correlation id on every answer, whatever the failure was', () => {
    for (const exception of [
      new WorkspaceNotFound(),
      new HttpException('Nope', HttpStatus.BAD_REQUEST),
    ]) {
      expect(answerTo(exception).body.error.correlationId).toBe(CORRELATION_ID);
    }
  });
});
