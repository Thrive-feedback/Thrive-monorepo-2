import { ProfileSlugInvalidError } from '../profile.errors';

const SEPARATORS = /[._-]+/gu;
const NOT_ALLOWED = /[^a-z0-9._-]/gu;
const EDGE_SEPARATORS = /^[._-]+|[._-]+$/gu;
const TRAILING_SEPARATORS = /[._-]+$/u;
const VALID_SLUG = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u;

/**
 * A Profile's unique, readable handle, made from the email and never typed. It always
 * starts and ends with a letter or digit and never repeats a separator, so it reads well
 * in a link: `Ann..Lee+work@gmail.com` becomes `ann.lee`.
 */
export class ProfileSlug {
  static readonly MAX_LENGTH = 64;

  /** For an email whose part before `@` has nothing usable in it, such as `+abc@x.com`. */
  static readonly FALLBACK = 'member';

  private constructor(private readonly value: string) {}

  /** The slug a new Profile asks for first, before any clash is resolved. */
  static fromEmail(email: string): ProfileSlug {
    const at = email.lastIndexOf('@');
    const localPart = (at === -1 ? email : email.slice(0, at)).toLowerCase();
    const plus = localPart.indexOf('+');
    const cleaned = (plus === -1 ? localPart : localPart.slice(0, plus))
      .replace(NOT_ALLOWED, '-')
      .replace(SEPARATORS, (run) => run.charAt(0))
      .replace(EDGE_SEPARATORS, '');

    return new ProfileSlug(
      fitWithin(cleaned || ProfileSlug.FALLBACK, ProfileSlug.MAX_LENGTH),
    );
  }

  /** Rebuilds a stored slug. */
  static of(raw: string): ProfileSlug {
    if (raw.length > ProfileSlug.MAX_LENGTH || !VALID_SLUG.test(raw)) {
      throw new ProfileSlugInvalidError();
    }
    return new ProfileSlug(raw);
  }

  /**
   * The slugs to try for this one, in order: itself, then `-2`, `-3` and on, starting at
   * position `from` (1 is itself). A long slug is shortened so the number still fits.
   */
  candidates(from: number, count: number): ProfileSlug[] {
    return Array.from({ length: count }, (_, index) =>
      this.numbered(from + index),
    );
  }

  /** The first of `candidates` nobody holds, or `null` when every one is taken. */
  static firstFree(
    candidates: readonly ProfileSlug[],
    taken: readonly ProfileSlug[],
  ): ProfileSlug | null {
    const held = new Set(taken.map((slug) => slug.value));
    return candidates.find((slug) => !held.has(slug.value)) ?? null;
  }

  equals(other: ProfileSlug): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private numbered(position: number): ProfileSlug {
    if (position <= 1) {
      return this;
    }
    const suffix = `-${position}`;
    return new ProfileSlug(
      fitWithin(this.value, ProfileSlug.MAX_LENGTH - suffix.length) + suffix,
    );
  }
}

/** Cutting can leave a separator at the end, which a slug never has. */
function fitWithin(value: string, maxLength: number): string {
  return value.slice(0, maxLength).replace(TRAILING_SEPARATORS, '');
}
