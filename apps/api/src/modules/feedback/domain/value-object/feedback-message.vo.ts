import {
  FeedbackMessageEmptyError,
  FeedbackMessageTooLongError,
} from '../feedback-request.errors';

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * What a Giver wrote, in answer to an Ask or without being asked (glossary: Feedback message): no
 * Questions and no ratings (`ADR-0022`). Surrounding whitespace goes; the whitespace inside does
 * not, because where somebody put their paragraphs is part of what they wrote.
 *
 * 1,000 is the product's limit on what fits a postcard, the same for a Feedback message and a
 * Request message. It counts what a reader sees as one character, so Thai marks do not use it up.
 * It binds what is written from now on: rows stored under the earlier 4,000 are still read.
 * The column is `text`, so changing it costs no migration.
 */
export class FeedbackMessage {
  static readonly MAX_LENGTH = 1000;

  private constructor(private readonly value: string) {}

  static of(raw: string): FeedbackMessage {
    const trimmed = raw.trim();
    const length = [...graphemes.segment(trimmed)].length;
    if (length === 0) {
      throw new FeedbackMessageEmptyError();
    }
    if (length > FeedbackMessage.MAX_LENGTH) {
      throw new FeedbackMessageTooLongError(FeedbackMessage.MAX_LENGTH);
    }
    return new FeedbackMessage(trimmed);
  }

  toString(): string {
    return this.value;
  }
}
