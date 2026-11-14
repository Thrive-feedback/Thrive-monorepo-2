import { describe, expect, it } from 'vitest';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { byName, pageOf, searchTeammates } from './teammate-search.util';

function teammate(overrides: Partial<Teammate> & { name: string }): Teammate {
  return {
    accountId: overrides.name,
    email: `${overrides.name.toLowerCase().replace(/\s/g, '.')}@acme.test`,
    photoUrl: null,
    slug: null,
    displayName: null,
    ...overrides,
  };
}

const MALI = teammate({
  name: 'Mali Sombat',
  slug: 'mali',
  displayName: 'Mali',
});
const KRIT = teammate({
  name: 'krit Chan',
  slug: 'krit-c',
  displayName: 'Krit',
});
const NEW = teammate({
  name: 'new.person@acme.test',
  email: 'new.person@acme.test',
});

describe('byName', () => {
  it('puts Latin names before Thai, whatever language it runs in', () => {
    const thai = teammate({ name: 'กมล ใจดี' });
    const latin = teammate({ name: 'Alice Moon' });

    expect(byName([thai, latin]).map(({ name }) => name)).toEqual([
      'Alice Moon',
      'กมล ใจดี',
    ]);
  });

  it('orders teammates by name in any letter case', () => {
    expect(byName([MALI, NEW, KRIT]).map(({ name }) => name)).toEqual([
      'krit Chan',
      'Mali Sombat',
      'new.person@acme.test',
    ]);
  });
});

describe('searchTeammates', () => {
  const everyone = [MALI, KRIT, NEW];

  it('finds everyone when nothing is typed', () => {
    expect(searchTeammates(everyone, '   ')).toBe(everyone);
  });

  it('finds a teammate by name, in any letter case', () => {
    expect(searchTeammates(everyone, 'SOMBAT')).toEqual([MALI]);
  });

  it('finds a teammate by the name they go by, held nowhere else', () => {
    const zen = teammate({
      name: 'Kritsada Chan',
      slug: 'kritsada',
      displayName: 'Zen',
    });

    expect(searchTeammates([...everyone, zen], 'zen')).toEqual([zen]);
  });

  it('finds a teammate by email', () => {
    expect(searchTeammates(everyone, 'new.person@')).toEqual([NEW]);
  });

  it('finds a teammate by @handle, the @ read past', () => {
    expect(searchTeammates(everyone, '@krit-c')).toEqual([KRIT]);
  });

  it('finds one who has not introduced themselves by the start of their email', () => {
    expect(searchTeammates(everyone, '@new.person')).toEqual([NEW]);
  });

  it('finds nobody for what no teammate holds', () => {
    expect(searchTeammates(everyone, 'zed')).toEqual([]);
  });
});

describe('pageOf', () => {
  const numbers = Array.from({ length: 23 }, (_, index) => index + 1);

  it('shows ten at a time, and counts the pages', () => {
    expect(pageOf(numbers, 1)).toEqual({
      items: numbers.slice(0, 10),
      page: 1,
      pageTotal: 3,
    });
    expect(pageOf(numbers, 3).items).toEqual([21, 22, 23]);
  });

  it('keeps a page past either end on the nearest one', () => {
    expect(pageOf(numbers, 9).page).toBe(3);
    expect(pageOf(numbers, 0).page).toBe(1);
  });

  it('counts an empty list as one page', () => {
    expect(pageOf([], 1)).toEqual({ items: [], page: 1, pageTotal: 1 });
  });
});
