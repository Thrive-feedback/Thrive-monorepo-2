import { describe, expect, it } from 'vitest';
import {
  matchesSearch,
  mentionHandle,
  searchWord,
  takeMentions,
} from './member-search.util';
import type { Teammate } from './teammate.type';

const MALI: Teammate = {
  accountId: 'mali',
  name: 'Mali Sombat',
  email: 'mali@acme.test',
  photoUrl: null,
  slug: 'mali',
  displayName: 'Mali',
};
const CHAI: Teammate = {
  accountId: 'chai',
  name: 'chai.s@acme.test',
  email: 'chai.s@acme.test',
  photoUrl: null,
  slug: null,
  displayName: null,
};
const TEAM = [MALI, CHAI];

describe('mentionHandle', () => {
  it('is the slug', () => {
    expect(mentionHandle(MALI)).toBe('mali');
  });

  it('is the start of the email while there is no slug', () => {
    expect(mentionHandle(CHAI)).toBe('chai.s');
  });
});

describe('takeMentions', () => {
  it('takes a handle once a space follows it', () => {
    expect(takeMentions('@mali ', TEAM)).toEqual({
      accountIds: ['mali'],
      rest: '',
      unknown: [],
    });
  });

  it('leaves the handle still being typed alone', () => {
    expect(takeMentions('@mali @cha', TEAM)).toEqual({
      accountIds: ['mali'],
      rest: '@cha',
      unknown: [],
    });
  });

  it('takes every handle at once when told the text is finished', () => {
    expect(
      takeMentions('@MALI, @chai.s', TEAM, { finishAll: true }).accountIds,
    ).toEqual(['mali', 'chai']);
  });

  it('keeps a handle that names nobody, so it can be fixed', () => {
    expect(takeMentions('@mali @xyz ', TEAM)).toEqual({
      accountIds: ['mali'],
      rest: '@xyz ',
      unknown: ['@xyz'],
    });
  });

  it('names a teammate once however often they are typed', () => {
    expect(takeMentions('@mali @mali ', TEAM).accountIds).toEqual(['mali']);
  });

  it('keeps plain words as they are', () => {
    expect(takeMentions('sombat ', TEAM)).toEqual({
      accountIds: [],
      rest: 'sombat ',
      unknown: [],
    });
  });
});

describe('searchWord', () => {
  it('is the last word, without its @', () => {
    expect(searchWord('@mali @Ch')).toBe('ch');
  });

  it('is empty after a space', () => {
    expect(searchWord('@xyz ')).toBe('');
  });
});

describe('matchesSearch', () => {
  it('matches the name, the email or the handle', () => {
    expect(matchesSearch(MALI, 'somb')).toBe(true);
    expect(matchesSearch(MALI, 'acme')).toBe(true);
    expect(matchesSearch(CHAI, 'chai.s')).toBe(true);
    expect(matchesSearch(MALI, 'krit')).toBe(false);
  });

  it('matches everyone for an empty word', () => {
    expect(matchesSearch(MALI, '')).toBe(true);
  });
});
