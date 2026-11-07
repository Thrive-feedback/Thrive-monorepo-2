import { describe, expect, it } from 'vitest';
import {
  checkDescription,
  checkName,
  hashtagOf,
  tidyName,
} from './workspace-goal-name.util';

describe('checking a Workspace Goal name before it is sent', () => {
  it.each(['ownership', '#Customer-First', 'ship_2026', 'ความเป็นเจ้าของ'])(
    'accepts %s',
    (name) => {
      expect(checkName(name)).toBeUndefined();
    },
  );

  it.each([
    ['', 'Give it a name.'],
    ['#', 'Give it a name.'],
    ['ship it', 'Use - instead of spaces.'],
    ['own.ership', 'Use only letters, numbers, - and _.'],
    ['a'.repeat(31), 'Keep it to 30 characters.'],
  ])('refuses %j with %s', (name, message) => {
    expect(checkName(name)).toBe(message);
  });

  it('counts a Thai cluster as one character', () => {
    expect(checkName('ที่'.repeat(30))).toBeUndefined();
  });

  it('sends the name without its # or surrounding spaces', () => {
    expect(tidyName('  #ownership ')).toBe('ownership');
  });

  it('writes the name as Members write it', () => {
    expect(hashtagOf('ownership')).toBe('#ownership');
  });
});

describe('checking a Workspace Goal description before it is sent', () => {
  it('accepts none at all', () => {
    expect(checkDescription('   ')).toBeUndefined();
  });

  it('refuses more than one sentence of 200 characters', () => {
    expect(checkDescription('a'.repeat(201))).toBe(
      'Keep it to one sentence of 200 characters.',
    );
  });
});
