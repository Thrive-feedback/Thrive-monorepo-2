import { describe, expect, it } from 'bun:test';
import {
  RequestMessageEmptyError,
  RequestMessageTooLongError,
} from '../feedback-request.errors';
import { RequestMessage } from './request-message.vo';

describe('a Request message', () => {
  it('keeps what the Requester wrote, with surrounding and repeated spaces collapsed', () => {
    expect(RequestMessage.of('  my   presentation skills ').toString()).toBe(
      'my presentation skills',
    );
  });

  it('is refused when it is only spaces, because that says nothing', () => {
    expect(() => RequestMessage.of('   ')).toThrow(RequestMessageEmptyError);
  });

  it('is refused when it is longer than a short text', () => {
    expect(() =>
      RequestMessage.of('a'.repeat(RequestMessage.MAX_LENGTH + 1)),
    ).toThrow(RequestMessageTooLongError);
  });

  it('counts a Thai cluster as the one character a reader sees', () => {
    const cluster = 'ที่';

    expect(() =>
      RequestMessage.of(cluster.repeat(RequestMessage.MAX_LENGTH)),
    ).not.toThrow();
  });
});
