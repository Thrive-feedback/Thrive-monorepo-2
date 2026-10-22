import {
  RequestMessageEmptyError,
  RequestMessageTooLongError,
} from '../feedback-request.errors';

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * What the Requester writes when sending a Feedback Request — the free text the people asked
 * read before they answer (glossary: Request message). Surrounding and repeated whitespace is
 * collapsed, and the limit counts what a reader sees as one character, so Thai marks do not use
 * it up.
 *
 * 200 is this release's reading of a short message, carried over from the retired Topic
 * (`ADR-0039`); the column is `text`, so raising it costs no migration.
 */
export class RequestMessage {
  static readonly MAX_LENGTH = 200;

  private constructor(private readonly value: string) {}

  static of(raw: string): RequestMessage {
    const normalized = raw.trim().replace(/\s+/gu, ' ');
    const length = [...graphemes.segment(normalized)].length;
    if (length === 0) {
      throw new RequestMessageEmptyError();
    }
    if (length > RequestMessage.MAX_LENGTH) {
      throw new RequestMessageTooLongError(RequestMessage.MAX_LENGTH);
    }
    return new RequestMessage(normalized);
  }

  equals(other: RequestMessage): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
