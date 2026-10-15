import { TopicEmptyError, TopicTooLongError } from '../feedback-request.errors';

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * What a piece of Feedback is about — a short text written by the Requester of a Feedback
 * Request, or by the Giver of Offered Feedback. Surrounding and repeated whitespace is
 * collapsed, and the limit counts what a reader sees as one character, so Thai marks do not use
 * it up.
 *
 * The glossary calls a Topic "a short text" without naming a length; 200 is this release's
 * reading of short, and the column is `text`, so raising it costs no migration.
 */
export class Topic {
  static readonly MAX_LENGTH = 200;

  private constructor(private readonly value: string) {}

  static of(raw: string): Topic {
    const normalized = raw.trim().replace(/\s+/gu, ' ');
    const length = [...graphemes.segment(normalized)].length;
    if (length === 0) {
      throw new TopicEmptyError();
    }
    if (length > Topic.MAX_LENGTH) {
      throw new TopicTooLongError(Topic.MAX_LENGTH);
    }
    return new Topic(normalized);
  }

  equals(other: Topic): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
