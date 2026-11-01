import { describe, expect, it } from 'vitest';
import { MAX_KUDOS_LENGTH } from '@/lib/feedback/kudos-item.type';
import { fittedSizeStep, kudosCardDate } from './kudos-card.util';

describe('the size a Kudos is set in', () => {
  it('is the size the Giver chose while the message is short', () => {
    expect(fittedSizeStep(4, 20)).toBe(4);
    expect(fittedSizeStep(1, 20)).toBe(1);
  });

  it('steps down as the message grows, so the card never has to scroll', () => {
    expect(fittedSizeStep(4, 100)).toBe(3);
    expect(fittedSizeStep(4, 150)).toBe(2);
    expect(fittedSizeStep(4, MAX_KUDOS_LENGTH)).toBe(1);
  });

  it('never makes a message larger than the Giver chose', () => {
    expect(fittedSizeStep(0, 10)).toBe(0);
  });
});

describe('the date on the back of a card', () => {
  it('is written out', () => {
    expect(kudosCardDate('2026-10-15T03:00:00.000Z')).toBe('15 October 2026');
  });

  it('is the day on the clock the board reads its months on', () => {
    expect(kudosCardDate('2026-10-31T23:00:00.000Z')).toBe('1 November 2026');
  });
});
