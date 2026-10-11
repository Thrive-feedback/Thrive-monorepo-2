import { VisibilityInvalidError } from '../feedback-request.errors';

export const VISIBILITIES = ['ONLY_ME', 'SELECTED_PEOPLE', 'EVERYONE'] as const;

export type VisibilityValue = (typeof VISIBILITIES)[number];

function isVisibility(raw: string): raw is VisibilityValue {
  return (VISIBILITIES as readonly string[]).includes(raw);
}

/**
 * Who besides the Giver and the Receiver may read the Feedback a request collects. Chosen when
 * sending and never changed afterwards (`ADR-0022`).
 *
 * Choosing is #83. Until then every request is opened with `onlyMe()`, the narrowest audience,
 * so nothing written now can be read more widely than the Requester once the choice arrives.
 */
export class Visibility {
  private constructor(private readonly value: VisibilityValue) {}

  static onlyMe(): Visibility {
    return new Visibility('ONLY_ME');
  }

  static of(raw: string): Visibility {
    if (!isVisibility(raw)) {
      throw new VisibilityInvalidError();
    }
    return new Visibility(raw);
  }

  equals(other: Visibility): boolean {
    return this.value === other.value;
  }

  toString(): VisibilityValue {
    return this.value;
  }
}
