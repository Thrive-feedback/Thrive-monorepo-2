import { describe, expect, it } from 'bun:test';
import {
  AskAlreadyAnsweredError,
  AskStatusInvalidError,
} from '../feedback-request.errors';
import { ASK_STATUSES, AskStatus } from './ask-status.vo';

describe('where an Ask stands', () => {
  it('reads back each status the store can hold', () => {
    for (const status of ASK_STATUSES) {
      expect(AskStatus.of(status).toString()).toBe(status);
    }
  });

  it('refuses a status nothing in the product has', () => {
    expect(() => AskStatus.of('DECLINED')).toThrow(AskStatusInvalidError);
  });

  it('answers a Pending Ask', () => {
    expect(AskStatus.Pending.answered().toString()).toBe('ANSWERED');
  });

  it('refuses to answer an Ask twice, because the first answer is final', () => {
    expect(() => AskStatus.Pending.answered().answered()).toThrow(
      AskAlreadyAnsweredError,
    );
  });
});
