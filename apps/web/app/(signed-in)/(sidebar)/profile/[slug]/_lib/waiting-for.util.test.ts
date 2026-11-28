import { describe, expect, it } from 'vitest';
import { waitingFor } from './waiting-for.util';

const NOW = Date.parse('2026-11-28T10:00:00.000Z');

describe('waitingFor', () => {
  it('counts whole days, never weeks or months', () => {
    expect(waitingFor('2026-11-07T09:00:00.000Z', NOW)).toBe('waiting 21 days');
  });

  it('says one day in the singular', () => {
    expect(waitingFor('2026-11-27T09:00:00.000Z', NOW)).toBe('waiting 1 day');
  });

  it('says since today under a day, and for a time a little ahead of the clock', () => {
    expect([
      waitingFor('2026-11-28T02:00:00.000Z', NOW),
      waitingFor('2026-11-28T10:00:05.000Z', NOW),
    ]).toEqual(['waiting since today', 'waiting since today']);
  });
});
