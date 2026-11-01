import { describe, expect, it } from 'vitest';
import { kudosCaptionName, kudosMonthName } from './kudos-board-place.util';

describe('names on the board', () => {
  it('writes a month out', () => {
    expect(kudosMonthName('2026-10')).toBe('October 2026');
    expect(kudosMonthName('2027-01')).toBe('January 2027');
  });

  it('calls somebody by their first name', () => {
    expect(kudosCaptionName('Mali Chaiyo', 'A teammate')).toBe('Mali');
  });

  it('calls somebody with no name yet what the screen calls them', () => {
    expect(kudosCaptionName(null, 'A teammate')).toBe('A teammate');
  });
});
