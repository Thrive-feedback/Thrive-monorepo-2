import { describe, expect, it } from 'bun:test';
import {
  KudosMessageEmptyError,
  KudosMessageTooLongError,
} from '../feedback-request.errors';
import { KudosMessage } from './kudos-message.vo';

describe('a Kudos message', () => {
  it('keeps what the Giver wrote, with the ends trimmed', () => {
    expect(KudosMessage.of('  @ben saved the launch.  ').toString()).toBe(
      '@ben saved the launch.',
    );
  });

  it('is refused when it is only spaces, because it praises nobody', () => {
    expect(() => KudosMessage.of('  \n ')).toThrow(KudosMessageEmptyError);
  });

  it('is refused past 280 characters, because a Kudos is a line or two', () => {
    expect(() => KudosMessage.of('a'.repeat(281))).toThrow(
      KudosMessageTooLongError,
    );
  });

  it('counts an emoji as the one character a reader sees', () => {
    expect(() =>
      KudosMessage.of('👏'.repeat(KudosMessage.MAX_LENGTH)),
    ).not.toThrow();
  });
});
