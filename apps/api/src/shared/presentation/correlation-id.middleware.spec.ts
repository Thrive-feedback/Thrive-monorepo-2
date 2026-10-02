import { describe, expect, it, mock } from 'bun:test';
import type { NextFunction, Response } from 'express';
import {
  CORRELATION_ID_HEADER,
  type CorrelatedRequest,
  CorrelationIdMiddleware,
} from './correlation-id.middleware';

const UUID_V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function run(header: string | undefined): {
  request: CorrelatedRequest;
  setHeader: ReturnType<typeof mock>;
  next: NextFunction;
} {
  const request = {
    header: (name: string) =>
      name === CORRELATION_ID_HEADER ? header : undefined,
  } as unknown as CorrelatedRequest;
  const setHeader = mock();
  const next = mock() as unknown as NextFunction;

  new CorrelationIdMiddleware().use(
    request,
    { setHeader } as unknown as Response,
    next,
  );

  return { request, setHeader, next };
}

describe('the correlation id on a request', () => {
  it("keeps the caller's id and sends it back on the response", () => {
    const { request, setHeader } = run('abc123');

    expect(request.correlationId).toBe('abc123');
    expect(setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, 'abc123');
  });

  it('mints a time-ordered id when the caller sends none', () => {
    const { request, setHeader } = run(undefined);

    expect(request.correlationId).toMatch(UUID_V7);
    expect(setHeader).toHaveBeenCalledWith(
      CORRELATION_ID_HEADER,
      request.correlationId,
    );
  });

  it('treats a blank id as none, so no trace starts with an empty string', () => {
    const { request } = run('   ');

    expect(request.correlationId).toMatch(UUID_V7);
  });

  it('passes the request on', () => {
    const { next } = run('abc123');

    expect(next).toHaveBeenCalled();
  });
});
