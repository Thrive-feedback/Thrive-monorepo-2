import { describe, expect, it } from 'bun:test';
import {
  FeedbackBodyEmptyError,
  FeedbackBodyTooLongError,
} from '../feedback-request.errors';
import { FeedbackBody } from './feedback-body.vo';

describe('an answer', () => {
  it('keeps what the Giver wrote, with the ends trimmed', () => {
    expect(
      FeedbackBody.of('  You lose the room at the detail.  ').toString(),
    ).toBe('You lose the room at the detail.');
  });

  it('keeps the paragraphs the Giver put in, because they are part of what they wrote', () => {
    const written = 'You open strongly.\n\nThen the detail loses the room.';

    expect(FeedbackBody.of(written).toString()).toBe(written);
  });

  it('is refused when it is only spaces, because that answers nothing', () => {
    expect(() => FeedbackBody.of('   \n  ')).toThrow(FeedbackBodyEmptyError);
  });

  it('is refused when it is longer than one answer', () => {
    expect(() => FeedbackBody.of('a'.repeat(4001))).toThrow(
      FeedbackBodyTooLongError,
    );
  });

  it('counts a Thai cluster as the one character a reader sees', () => {
    const cluster = 'ที่';

    expect(() =>
      FeedbackBody.of(cluster.repeat(FeedbackBody.MAX_LENGTH)),
    ).not.toThrow();
  });
});
