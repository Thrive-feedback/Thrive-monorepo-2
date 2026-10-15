import {
  NoPeopleSelectedError,
  PeopleSelectedForAnotherVisibilityError,
  PersonAlreadySelectedError,
  VisibilityInvalidError,
} from '../feedback-request.errors';

export const VISIBILITIES = ['ONLY_ME', 'SELECTED_PEOPLE', 'EVERYONE'] as const;

export type VisibilityValue = (typeof VISIBILITIES)[number];

function isVisibility(raw: string): raw is VisibilityValue {
  return (VISIBILITIES as readonly string[]).includes(raw);
}

/**
 * Who besides the Giver and the Receiver may read a piece of Feedback: nobody, the Members
 * selected, or every Member of the Workspace. Chosen when sending — by the Requester for what a
 * request collects, by the Giver for Offered Feedback — and never changed afterwards
 * (`ADR-0022`).
 *
 * The selected people belong to the Visibility rather than sitting beside it, so a Visibility of
 * Selected people with nobody in it, or of Everyone with somebody picked, cannot be built.
 */
export class Visibility {
  private constructor(
    private readonly value: VisibilityValue,
    private readonly selected: readonly string[],
  ) {}

  static onlyMe(): Visibility {
    return new Visibility('ONLY_ME', []);
  }

  static of(chosen: {
    readonly value: string;
    readonly selectedAccountIds: readonly string[];
  }): Visibility {
    if (!isVisibility(chosen.value)) {
      throw new VisibilityInvalidError();
    }
    const selected = chosen.selectedAccountIds;
    if (chosen.value !== 'SELECTED_PEOPLE') {
      if (selected.length > 0) {
        throw new PeopleSelectedForAnotherVisibilityError();
      }
      return new Visibility(chosen.value, []);
    }
    if (selected.length === 0) {
      throw new NoPeopleSelectedError();
    }
    if (new Set(selected).size !== selected.length) {
      throw new PersonAlreadySelectedError();
    }
    return new Visibility(chosen.value, [...selected]);
  }

  /** The Members picked when the Visibility is Selected people; empty otherwise. */
  selectedAccountIds(): readonly string[] {
    return this.selected;
  }

  /**
   * Whether one Member may read a piece of Feedback. The Giver who wrote it and the Receiver it
   * is for always may; anyone else only as this Visibility allows.
   *
   * The reader must already be known to be a Member of the Feedback's Workspace: Everyone means
   * every Member, and this cannot tell a Member from a stranger.
   */
  letsRead(reading: {
    readonly readerAccountId: string;
    readonly giverAccountId: string;
    readonly receiverAccountId: string;
  }): boolean {
    if (
      reading.readerAccountId === reading.giverAccountId ||
      reading.readerAccountId === reading.receiverAccountId
    ) {
      return true;
    }
    switch (this.value) {
      case 'EVERYONE':
        return true;
      case 'SELECTED_PEOPLE':
        return this.selected.includes(reading.readerAccountId);
      case 'ONLY_ME':
        return false;
    }
  }

  equals(other: Visibility): boolean {
    return (
      this.value === other.value &&
      this.selected.length === other.selected.length &&
      this.selected.every((accountId) => other.selected.includes(accountId))
    );
  }

  toString(): VisibilityValue {
    return this.value;
  }
}
