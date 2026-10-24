import { describe, expect, it } from 'vitest';
import { timeAgo } from './time-ago.util';

const NOW = Date.parse('2026-10-24T12:00:00.000Z');

function ago(milliseconds: number): string {
  return timeAgo(new Date(NOW - milliseconds).toISOString(), NOW);
}

describe('timeAgo', () => {
  it('calls anything under a minute just now', () => {
    expect(ago(0)).toBe('just now');
    expect(ago(59_000)).toBe('just now');
  });

  it('counts in the largest unit that fits', () => {
    expect(ago(5 * 60_000)).toBe('5 minutes ago');
    expect(ago(3 * 60 * 60_000)).toBe('3 hours ago');
    expect(ago(2 * 24 * 60 * 60_000)).toBe('2 days ago');
    expect(ago(24 * 60 * 60_000)).toBe('yesterday');
    expect(ago(10 * 24 * 60 * 60_000)).toBe('last week');
    expect(ago(400 * 24 * 60 * 60_000)).toBe('last year');
  });

  it('says just now for a stamp from the future, which a clock a little ahead can make', () => {
    expect(timeAgo(new Date(NOW + 30_000).toISOString(), NOW)).toBe('just now');
  });
});
