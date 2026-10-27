import { describe, expect, it } from 'vitest';
import { chosenPeople } from './chosen-people.util';
import type { Teammate } from './teammate.type';

const TEAM: readonly Teammate[] = [
  {
    accountId: 'mali',
    name: 'Mali Sombat',
    email: 'mali@acme.test',
    slug: 'mali',
    displayName: 'Mali',
  },
  {
    accountId: 'chai',
    name: 'chai.s@acme.test',
    email: 'chai.s@acme.test',
    slug: null,
    displayName: null,
  },
];

describe('chosenPeople', () => {
  it('names the teammates in the order given, skipping ids that name nobody', () => {
    expect(chosenPeople(TEAM, ['chai', 'gone', 'mali'])).toEqual([
      { id: 'chai', name: 'chai.s@acme.test' },
      { id: 'mali', name: 'Mali Sombat' },
    ]);
  });
});
