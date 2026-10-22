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
 * The glossary names no length. 4,000 is this release's reading of "one answer" — roughly four
 * screens of writing — accepted as an engineering reading on 2026-10-12 and still the product's
 * to overturn. The column is `text`, so raising it costs no migration.
 */
export class FeedbackMessage {
  static readonly MAX_LENGTH = 4000;

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
