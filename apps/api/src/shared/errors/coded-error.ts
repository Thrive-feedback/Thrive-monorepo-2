/**
 * The base for every failure this application raises on purpose, as opposed to the ones a
 * library or the runtime throws.
 *
 * A failure carries two things a caller can use: a code, which is stable and may be
 * branched on, and a category, which says what kind of failure it is. The category is
 * deliberately not an HTTP status — the domain has no business knowing about HTTP, and
 * keeping the mapping in one place outside it means adding a failure never means
 * revisiting that mapping.
 */
export type ErrorCategory =
  | 'validation'
  | 'unauthenticated'
  | 'not_found'
  | 'conflict'
  | 'forbidden';

export abstract class CodedError extends Error {
  /**
   * Stable once shipped: callers branch on it and people quote it. The message beside it
   * is prose and may be reworded freely, which is why nothing may match on the message.
   */
  abstract readonly code: string;

  abstract readonly category: ErrorCategory;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** A business rule refused the operation. Raised by the domain, never by a controller. */
export abstract class DomainError extends CodedError {}

/**
 * The workflow could not proceed — something was absent, duplicated, or in the wrong
 * state. Raised by a use case, which knows about the workflow; the domain does not.
 */
export abstract class ApplicationError extends CodedError {}
