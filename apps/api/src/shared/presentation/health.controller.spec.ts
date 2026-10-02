import { describe, expect, it } from 'bun:test';
import { healthResponseSchema } from './dto/health.dto';
import { HealthController } from './health.controller';

describe('the health probe', () => {
  it('answers that the API is up', () => {
    expect(new HealthController().check()).toEqual({ status: 'ok' });
  });

  it('answers in the shape it publishes', () => {
    expect(
      healthResponseSchema.safeParse(new HealthController().check()).success,
    ).toBe(true);
  });
});
