import { describe, expect, it } from 'vitest';
import { WaitingSearchParams } from './waiting-search-params.schema';

const ASK_ID = '0199a0f0-0000-7000-8000-0000000000a1';

describe('WaitingSearchParams', () => {
  it('opens on the list', () => {
    expect(WaitingSearchParams.parse({}).ask).toBeUndefined();
  });

  it('keeps the Ask named in the address', () => {
    expect(WaitingSearchParams.parse({ ask: ASK_ID }).ask).toBe(ASK_ID);
  });

  it('opens newest first', () => {
    expect(WaitingSearchParams.parse({}).sort).toBe('newest');
  });

  it('keeps the order named in the address', () => {
    expect(WaitingSearchParams.parse({ sort: 'oldest' }).sort).toBe('oldest');
  });

  it('falls back to newest first for an order it does not offer', () => {
    expect(WaitingSearchParams.parse({ sort: 'random' }).sort).toBe('newest');
  });

  it('ignores anything that is not an id', () => {
    expect(WaitingSearchParams.parse({ ask: 'nonsense' }).ask).toBeUndefined();
  });
});
