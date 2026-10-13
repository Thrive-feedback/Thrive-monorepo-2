import { describe, expect, it } from 'vitest';
import { initials } from './initials.util';

describe('initials', () => {
  it('takes the first letter of the first and last word', () => {
    expect(initials('Ann Marie Lee')).toBe('AL');
  });

  it('takes one letter from a one-word name', () => {
    expect(initials('ann')).toBe('A');
  });

  it('ignores extra spaces', () => {
    expect(initials('  Ann   Lee ')).toBe('AL');
  });

  it('gives nothing for an empty name', () => {
    expect(initials('   ')).toBe('');
  });
});
