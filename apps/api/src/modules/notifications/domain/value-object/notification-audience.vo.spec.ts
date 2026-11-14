import { describe, expect, it } from 'bun:test';
import { storedAudience } from './notification-audience.vo';

describe('who can read what a stored line names', () => {
  it('reads each of the three audiences as itself', () => {
    expect(storedAudience('ONLY_ME')).toBe('ONLY_ME');
    expect(storedAudience('SELECTED_PEOPLE')).toBe('SELECTED_PEOPLE');
    expect(storedAudience('EVERYONE')).toBe('EVERYONE');
  });

  it('reads a row that recorded none as having none', () => {
    expect(storedAudience(null)).toBeNull();
  });

  it('reads a value it does not know as none, so the bell draws no icon rather than a wrong one', () => {
    expect(storedAudience('FRIENDS_OF_FRIENDS')).toBeNull();
  });

  it('reads a value that differs only in case as none', () => {
    expect(storedAudience('everyone')).toBeNull();
  });
});
