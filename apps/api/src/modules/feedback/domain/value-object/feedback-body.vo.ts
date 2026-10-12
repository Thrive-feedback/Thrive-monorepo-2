import {
  FeedbackBodyEmptyError,
  FeedbackBodyTooLongError,
} from '../feedback-request.errors';

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * What a Giver wrote in answer to an Ask: one free-text answer, no Questions and no ratings
 * (`ADR-0022`). Surrounding whitespace goes; the whitespace inside does not, because where
 * somebody put their paragraphs is part of what they wrote.
 *
 * The glossary names no length. 4,000 is this release's reading of "one answer" — roughly four
 * screens of writing — accepted as an engineering reading on 2026-10-12 and still the product's
 * to overturn. The column is `text`, so raising it costs no migration.
 */
export class FeedbackBody {
  static readonly MAX_LENGTH = 4000;

  private constructor(private readonly value: string) {}

  static of(raw: string): FeedbackBody {
    const trimmed = raw.trim();
    const length = [...graphemes.segment(trimmed)].length;
    if (length === 0) {
      throw new FeedbackBodyEmptyError();
    }
    if (length > FeedbackBody.MAX_LENGTH) {
      throw new FeedbackBodyTooLongError(FeedbackBody.MAX_LENGTH);
    }
    return new FeedbackBody(trimmed);
  }

  toString(): string {
    return this.value;
  }
}
