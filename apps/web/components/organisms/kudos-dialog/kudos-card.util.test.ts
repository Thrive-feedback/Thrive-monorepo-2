import { describe, expect, it } from 'vitest';
import { MAX_KUDOS_LENGTH } from '@/lib/feedback/kudos-item.type';
import {
  guessedSizeStep,
  kudosCardDate,
  largestShareThatFits,
  shareOfSize,
} from './kudos-card.util';

describe('the size a Kudos is set in', () => {
  it('is the size the Giver chose when the words fit at it', () => {
    expect(largestShareThatFits(() => true, 0.5)).toBe(1);
  });

  it('is as large a share of it as the words still fit at', () => {
    const share = largestShareThatFits((tried) => tried <= 0.8, 0.5);
    expect(share).toBeLessThanOrEqual(0.8);
    expect(share).toBeGreaterThan(0.79);
  });

  it('is the smallest step when the words fit at nothing larger', () => {
    expect(largestShareThatFits(() => false, 0.5)).toBe(0.5);
  });

  it('measures the smallest step against the one chosen', () => {
    expect(shareOfSize(0, 4)).toBeCloseTo(13 / 28);
    expect(shareOfSize(4, 4)).toBe(1);
  });
});

describe('the size guessed before anything is measured', () => {
  it('is the size the Giver chose while the message is short', () => {
    expect(guessedSizeStep(4, 20)).toBe(4);
    expect(guessedSizeStep(1, 20)).toBe(1);
  });

  it('steps down as the message grows', () => {
    expect(guessedSizeStep(4, 100)).toBe(3);
    expect(guessedSizeStep(4, 150)).toBe(2);
    expect(guessedSizeStep(4, MAX_KUDOS_LENGTH)).toBe(1);
  });

  it('never makes a message larger than the Giver chose', () => {
    expect(guessedSizeStep(0, 10)).toBe(0);
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
