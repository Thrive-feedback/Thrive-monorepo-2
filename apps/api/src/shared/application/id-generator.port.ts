/**
 * Minting an identifier is inverted the same way reading the time is: a use case asks for
 * one, and nothing above infrastructure knows where it comes from.
 *
 * An id minted here exists before the record does, which is what lets a new entity carry
 * its own identity instead of waiting for a database to assign one.
 */
export abstract class IdGenerator {
  /** A fresh UUIDv7, so ids sort by the time they were created. */
  abstract next(): string;
}
