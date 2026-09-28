import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import type { z } from 'zod';

/**
 * Reads one request header through a schema. Nest never runs pipes on `@Headers()`, so
 * without this a header reaches the use case unvalidated while every other input is
 * parsed at the boundary. A failure answers like any other invalid request.
 */
export function ValidatedHeader<T extends z.ZodType>(name: string, schema: T): ParameterDecorator {
  return createParamDecorator((_: unknown, context: ExecutionContext): z.infer<T> => {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
    const parsed = schema.safeParse(request.headers[name.toLowerCase()]);

    if (!parsed.success) {
      throw new ZodValidationException(parsed.error);
    }
    return parsed.data;
  })();
}
