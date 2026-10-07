import {
  DisplayNameEmptyError,
  DisplayNameTooLongError,
} from '../profile.errors';
import { PersonName } from './person-name.vo';

/** The name other Members see and call you by. Free text, and not unique. */
export class DisplayName {
  static readonly MAX_LENGTH = 50;

  private constructor(private readonly value: string) {}

  static of(raw: string): DisplayName {
    const name = PersonName.of(raw);
    if (name.isEmpty) {
      throw new DisplayNameEmptyError();
    }
    if (name.length > DisplayName.MAX_LENGTH) {
      throw new DisplayNameTooLongError(DisplayName.MAX_LENGTH);
    }
    return new DisplayName(name.toString());
  }

  equals(other: DisplayName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
