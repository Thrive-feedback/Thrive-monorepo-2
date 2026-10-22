import { describe, expect, it } from 'bun:test';
import {
  FeedbackMessageEmptyError,
  FeedbackMessageTooLongError,
} from '../feedback-request.errors';
import { FeedbackMessage } from './feedback-message.vo';

describe('an answer', () => {
  it('keeps what the Giver wrote, with the ends trimmed', () => {
    expect(
      FeedbackMessage.of('  You lose the room at the detail.  ').toString(),
    ).toBe('You lose the room at the detail.');
  });

  it('keeps the paragraphs the Giver put in, because they are part of what they wrote', () => {
    const written = 'You open strongly.\n\nThen the detail loses the room.';

    expect(FeedbackMessage.of(written).toString()).toBe(written);
  });

  it('is refused when it is only spaces, because that answers nothing', () => {
    expect(() => FeedbackMessage.of('   \n  ')).toThrow(
      FeedbackMessageEmptyError,
    );
  });

  it('is refused when it is longer than one answer', () => {
    expect(() => FeedbackMessage.of('a'.repeat(4001))).toThrow(
      FeedbackMessageTooLongError,
    );
  });

  it('counts a Thai cluster as the one character a reader sees', () => {
    const cluster = 'ที่';

    expect(() =>
      FeedbackMessage.of(cluster.repeat(FeedbackMessage.MAX_LENGTH)),
    ).not.toThrow();
  });
});
