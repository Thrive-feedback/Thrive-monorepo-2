import { describe, expect, it } from 'vitest';
import { chosenPeople } from './chosen-people.util';
import type { Teammate } from './teammate.type';

const TEAM: readonly Teammate[] = [
  {
    accountId: 'mali',
    name: 'Mali Sombat',
    email: 'mali@acme.test',
    photoUrl: 'https://lh3.googleusercontent.com/a/mali=s96-c',
    slug: 'mali',
    displayName: 'Mali',
  },
  {
    accountId: 'chai',
    name: 'chai.s@acme.test',
    email: 'chai.s@acme.test',
    photoUrl: null,
    slug: null,
    displayName: null,
  },
];

describe('chosenPeople', () => {
  it('names the teammates with their photos in the order given, skipping ids that name nobody', () => {
    expect(chosenPeople(TEAM, ['chai', 'gone', 'mali'])).toEqual([
      { id: 'chai', name: 'chai.s@acme.test', photoUrl: null },
      {
        id: 'mali',
        name: 'Mali Sombat',
        photoUrl: 'https://lh3.googleusercontent.com/a/mali=s96-c',
      },
    ]);
  });
});
