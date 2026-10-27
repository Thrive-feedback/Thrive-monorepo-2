import { describe, expect, it } from 'bun:test';
import {
  NoPeopleSelectedError,
  PeopleSelectedForAnotherVisibilityError,
  PersonAlreadySelectedError,
  VisibilityInvalidError,
} from '../feedback-request.errors';
import { isEveryone, Visibility } from './visibility.vo';

const GIVER = 'account-ben';
const RECEIVER = 'account-ann';

function reading(readerAccountId: string) {
  return {
    readerAccountId,
    giverAccountId: GIVER,
    receiverAccountIds: [RECEIVER],
  };
}

function selecting(...selectedAccountIds: string[]) {
  return Visibility.of({ value: 'SELECTED_PEOPLE', selectedAccountIds });
}

describe('choosing who may read a request’s answers', () => {
  it('keeps the people selected for Selected people', () => {
    expect(selecting('account-cara').selectedAccountIds()).toEqual([
      'account-cara',
    ]);
  });

  it('refuses Selected people with nobody selected', () => {
    expect(() => selecting()).toThrow(NoPeopleSelectedError);
  });

  it('refuses the same person selected twice', () => {
    expect(() => selecting('account-cara', 'account-cara')).toThrow(
      PersonAlreadySelectedError,
    );
  });

  it('refuses people selected for Everyone, who would not be the ones reading it', () => {
    expect(() =>
      Visibility.of({
        value: 'EVERYONE',
        selectedAccountIds: ['account-cara'],
      }),
    ).toThrow(PeopleSelectedForAnotherVisibilityError);
  });

  it('refuses a Visibility nothing in the product has', () => {
    expect(() =>
      Visibility.of({ value: 'MANAGERS', selectedAccountIds: [] }),
    ).toThrow(VisibilityInvalidError);
  });
});

describe('who may read a piece of Feedback', () => {
  it('lets the Receiver read it, whatever the Visibility', () => {
    expect(Visibility.onlyMe().letsRead(reading(RECEIVER))).toBe(true);
  });

  it('lets every one of several Receivers read it, whatever the Visibility', () => {
    const forBoth = (readerAccountId: string) => ({
      readerAccountId,
      giverAccountId: GIVER,
      receiverAccountIds: [RECEIVER, 'account-cara'],
    });

    expect(Visibility.onlyMe().letsRead(forBoth(RECEIVER))).toBe(true);
    expect(Visibility.onlyMe().letsRead(forBoth('account-cara'))).toBe(true);
    expect(Visibility.onlyMe().letsRead(forBoth('account-dan'))).toBe(false);
  });

  it('lets the Giver read what they wrote, whatever the Visibility', () => {
    expect(Visibility.onlyMe().letsRead(reading(GIVER))).toBe(true);
  });

  it('keeps Only me from every other Member', () => {
    expect(Visibility.onlyMe().letsRead(reading('account-cara'))).toBe(false);
  });

  it('lets a selected Member read it', () => {
    expect(selecting('account-cara').letsRead(reading('account-cara'))).toBe(
      true,
    );
  });

  it('keeps it from a Member who was not selected', () => {
    expect(selecting('account-cara').letsRead(reading('account-dan'))).toBe(
      false,
    );
  });

  it('lets any Member read it when it is shared with Everyone', () => {
    const everyone = Visibility.of({
      value: 'EVERYONE',
      selectedAccountIds: [],
    });

    expect(everyone.letsRead(reading('account-dan'))).toBe(true);
  });
});

describe('whether every Member may read it', () => {
  it('is true only of Everyone', () => {
    expect(
      Visibility.of({ value: 'EVERYONE', selectedAccountIds: [] }).isEveryone(),
    ).toBe(true);
    expect(Visibility.onlyMe().isEveryone()).toBe(false);
    expect(
      Visibility.of({
        value: 'SELECTED_PEOPLE',
        selectedAccountIds: ['account-ben'],
      }).isEveryone(),
    ).toBe(false);
  });

  it('answers the same of a stored value, for a caller holding a snapshot', () => {
    expect(isEveryone('EVERYONE')).toBe(true);
    expect(isEveryone('ONLY_ME')).toBe(false);
    expect(isEveryone('SELECTED_PEOPLE')).toBe(false);
  });
});
