import {
  RequestMessageEmptyError,
  RequestMessageTooLongError,
} from '../feedback-request.errors';

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * What the Requester writes when sending a Feedback Request — the free text the people asked
 * read before they answer (glossary: Request message). Surrounding whitespace goes; the whitespace
 * inside does not, because a postcard is read as it was written, paragraphs included. The limit
 * counts what a reader sees as one character, so Thai marks do not use it up.
 *
 * 1,000 is the product's limit on what fits a postcard, the same for a Feedback message and a
 * Request message. The column is `text`, so changing it costs no migration.
 */
export class RequestMessage {
  static readonly MAX_LENGTH = 1000;

  private constructor(private readonly value: string) {}

  static of(raw: string): RequestMessage {
    const trimmed = raw.trim();
    const length = [...graphemes.segment(trimmed)].length;
    if (length === 0) {
      throw new RequestMessageEmptyError();
    }
    if (length > RequestMessage.MAX_LENGTH) {
      throw new RequestMessageTooLongError(RequestMessage.MAX_LENGTH);
    }
    return new RequestMessage(trimmed);
  }

  equals(other: RequestMessage): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
