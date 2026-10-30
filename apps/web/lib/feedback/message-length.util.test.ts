import { describe, expect, it } from 'vitest';
import {
  cutToMessageLength,
  isWithinMessageLength,
  MAX_MESSAGE_LENGTH,
  messageLength,
} from './message-length.util';

const THAI_CLUSTER = 'ที่';

describe('messageLength', () => {
  it('counts a Thai cluster as the one character a reader sees', () => {
    expect(messageLength(THAI_CLUSTER)).toBe(1);
  });

  it('leaves out the spaces around a message, as the API does', () => {
    expect(messageLength('  hello \n')).toBe(5);
  });

  it('counts the line breaks inside a message', () => {
    expect(messageLength('a\nb')).toBe(3);
  });
});

describe('isWithinMessageLength', () => {
  it('takes a message exactly at the limit', () => {
    expect(isWithinMessageLength('a'.repeat(MAX_MESSAGE_LENGTH))).toBe(true);
  });

  it('refuses one character over', () => {
    expect(isWithinMessageLength('a'.repeat(MAX_MESSAGE_LENGTH + 1))).toBe(
      false,
    );
  });

  it('takes Thai that is longer in code units than the limit', () => {
    expect(isWithinMessageLength(THAI_CLUSTER.repeat(MAX_MESSAGE_LENGTH))).toBe(
      true,
    );
  });
});

describe('cutToMessageLength', () => {
  it('leaves a message within the limit as it is', () => {
    expect(cutToMessageLength('  hello\n')).toBe('  hello\n');
  });

  it('stops a longer message at the limit', () => {
    expect(cutToMessageLength('a'.repeat(MAX_MESSAGE_LENGTH + 5))).toBe(
      'a'.repeat(MAX_MESSAGE_LENGTH),
    );
  });

  it('never splits a Thai cluster', () => {
    const cut = cutToMessageLength(THAI_CLUSTER.repeat(MAX_MESSAGE_LENGTH + 1));

    expect(cut).toBe(THAI_CLUSTER.repeat(MAX_MESSAGE_LENGTH));
  });
});
