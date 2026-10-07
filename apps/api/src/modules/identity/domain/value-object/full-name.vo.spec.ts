import { describe, expect, it } from 'bun:test';
import { FullNameEmptyError, FullNameTooLongError } from '../profile.errors';
import { FullName } from './full-name.vo';

describe('a full name', () => {
  it('drops surrounding spaces and collapses repeated ones', () => {
    expect(FullName.of('  Ann   Lee ').toString()).toBe('Ann Lee');
  });

  it('is refused when it is only spaces', () => {
    expect(() => FullName.of('   ')).toThrow(FullNameEmptyError);
  });

  it('is accepted at exactly 100 characters', () => {
    expect(FullName.of('a'.repeat(100)).toString()).toHaveLength(100);
  });

  it('is refused past 100 characters', () => {
    expect(() => FullName.of('a'.repeat(101))).toThrow(FullNameTooLongError);
  });

  it('counts a Thai syllable with its vowel and tone marks as what a reader sees', () => {
    // "กิ่" is one consonant with two marks: three code units, one character on screen.
    expect(FullName.of('กิ่'.repeat(100)).toString()).toHaveLength(300);
  });
});
