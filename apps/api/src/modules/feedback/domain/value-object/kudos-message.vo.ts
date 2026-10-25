import {
  KudosMessageEmptyError,
  KudosMessageTooLongError,
} from '../feedback-request.errors';

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * What a Giver wrote in a Kudos. Surrounding whitespace goes; the whitespace inside does not, as
 * in a Feedback message.
 *
 * 280 characters, because Kudos is the fastest way to give Feedback (brain `ADR-0043`): a line
 * or two, not a letter. Counted in what a reader sees as characters, so an emoji is one.
 */
export class KudosMessage {
  static readonly MAX_LENGTH = 280;

  private constructor(private readonly value: string) {}

  static of(raw: string): KudosMessage {
    const trimmed = raw.trim();
    const length = [...graphemes.segment(trimmed)].length;
    if (length === 0) {
      throw new KudosMessageEmptyError();
    }
    if (length > KudosMessage.MAX_LENGTH) {
      throw new KudosMessageTooLongError(KudosMessage.MAX_LENGTH);
    }
    return new KudosMessage(trimmed);
  }

  toString(): string {
    return this.value;
  }
}
