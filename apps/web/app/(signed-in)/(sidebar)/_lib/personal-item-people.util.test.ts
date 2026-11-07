import { describe, expect, it } from 'vitest';
import { everyoneNamedIn, tileNamesOf } from './personal-item-people.util';

const person = (name: string | null) => ({
  accountId: name ?? 'nameless',
  name,
  photoUrl: null,
  inactive: false,
});

describe('tileNamesOf', () => {
  it('joins two people by first name', () => {
    expect(tileNamesOf([person('Ann Lee'), person('Chai Suk')])).toBe(
      'Ann & Chai',
    );
  });

  it('counts everybody past two', () => {
    expect(
      tileNamesOf([
        person('Ann Lee'),
        person('Chai Suk'),
        person('Dao Prasert'),
        person('Nok Wattana'),
      ]),
    ).toBe('Ann, Chai +2');
  });

  it('holds a place for somebody with no name yet', () => {
    expect(tileNamesOf([person(null), person('Chai Suk')])).toBe(
      'A teammate & Chai',
    );
  });
});

describe('everyoneNamedIn', () => {
  it('calls nobody the whole Workspace', () => {
    expect(everyoneNamedIn([])).toBe('the whole Workspace');
  });

  it('names everyone whole', () => {
    expect(everyoneNamedIn([person('Ann Lee'), person('Chai Suk')])).toBe(
      'Ann Lee and Chai Suk',
    );
  });
});
