import { FullNameEmptyError, FullNameTooLongError } from '../profile.errors';
import { PersonName } from './person-name.vo';

/** A person's full name, the way people tell two Members with the same Display name apart. */
export class FullName {
  static readonly MAX_LENGTH = 100;

  private constructor(private readonly value: string) {}

  static of(raw: string): FullName {
    const name = PersonName.of(raw);
    if (name.isEmpty) {
      throw new FullNameEmptyError();
    }
    if (name.length > FullName.MAX_LENGTH) {
      throw new FullNameTooLongError(FullName.MAX_LENGTH);
    }
    return new FullName(name.toString());
  }

  equals(other: FullName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
