import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { v7 as uuidv7 } from 'uuid';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

/** Where the id is parked so the rest of the request can reach it. */
export interface CorrelatedRequest extends Request {
  correlationId?: string;
}

/**
 * One request carries one id from the caller, through this application, and back out on
 * the response, so a failure a person reports can be found in the logs.
 *
 * When the caller sends none we mint one rather than letting the trace start nowhere, and
 * a blank or whitespace-only header counts as none — an empty id is worse than a fresh
 * one, because it looks deliberate in a log.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(
    request: CorrelatedRequest,
    response: Response,
    next: NextFunction,
  ): void {
    const incoming = request.header(CORRELATION_ID_HEADER);
    const correlationId =
      incoming !== undefined && incoming.trim() !== '' ? incoming : uuidv7();

    request.correlationId = correlationId;
    response.setHeader(CORRELATION_ID_HEADER, correlationId);
    next();
  }
}
