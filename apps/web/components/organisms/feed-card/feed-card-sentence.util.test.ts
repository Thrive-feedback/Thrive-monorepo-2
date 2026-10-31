import { describe, expect, it } from 'vitest';
import {
  feedCardGiver,
  feedCardSentence,
  readerFirst,
} from './feed-card-sentence.util';

const person = (accountId: string, name: string | null) => ({
  accountId,
  name,
  photoUrl: null,
  inactive: false,
});

const ANN = person('ann', 'Ann Lee');
const BEN = person('ben', 'Ben Carter');
const CARA = person('cara', 'Cara Diaz');
const DAO = person('dao', 'Dao Prasert');

describe('feedCardSentence', () => {
  it('names the Giver and the Receiver for somebody who is neither', () => {
    expect(feedCardSentence({ giver: BEN, receivers: [CARA] }, 'ann')).toBe(
      'Ben Carter gave feedback to Cara Diaz',
    );
  });

  it('calls the reader "you" when it is for them', () => {
    expect(feedCardSentence({ giver: BEN, receivers: [ANN] }, 'ann')).toBe(
      'Ben Carter gave feedback to you',
    );
  });

  it('calls the reader "You" when they gave it', () => {
    expect(feedCardSentence({ giver: ANN, receivers: [BEN] }, 'ann')).toBe(
      'You gave feedback to Ben Carter',
    );
  });

  it('names every Receiver, the reader first', () => {
    expect(
      feedCardSentence({ giver: BEN, receivers: [CARA, ANN, DAO] }, 'ann'),
    ).toBe('Ben Carter gave feedback to you, Cara Diaz and Dao Prasert');
  });

  it('calls somebody with no name yet a teammate', () => {
    expect(
      feedCardSentence(
        { giver: person('x', null), receivers: [person('y', null)] },
        'ann',
      ),
    ).toBe('A teammate gave feedback to a teammate');
  });
});

describe('readerFirst', () => {
  it('keeps the Giver’s order for somebody it is not for', () => {
    expect(readerFirst([CARA, DAO], 'ann').map(({ name }) => name)).toEqual([
      'Cara Diaz',
      'Dao Prasert',
    ]);
  });

  it('puts the reader first, and the rest in the Giver’s order', () => {
    expect(
      readerFirst([CARA, ANN, DAO], 'ann').map(({ name }) => name),
    ).toEqual(['Ann Lee', 'Cara Diaz', 'Dao Prasert']);
  });
});

describe('feedCardGiver', () => {
  it('calls the reader You', () => {
    expect(feedCardGiver(ANN, 'ann')).toBe('You');
  });

  it('calls somebody with no name yet a teammate', () => {
    expect(feedCardGiver(person('x', null), 'ann')).toBe('A teammate');
  });
});
