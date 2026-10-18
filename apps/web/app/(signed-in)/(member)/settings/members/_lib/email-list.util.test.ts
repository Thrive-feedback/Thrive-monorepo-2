import { describe, expect, it } from 'vitest';
import { checkEmailList, parseEmailList } from './email-list.util';

describe('parseEmailList', () => {
  it('reads addresses one per line or separated by commas', () => {
    expect(
      parseEmailList('ann@acme.test, ben@acme.test\ncara@acme.test'),
    ).toEqual({
      emails: ['ann@acme.test', 'ben@acme.test', 'cara@acme.test'],
      malformed: [],
    });
  });

  it('drops blanks and merges repeats, keeping the first spelling', () => {
    expect(
      parseEmailList(' Ann@Acme.test ,,\n\nann@acme.test ').emails,
    ).toEqual(['Ann@Acme.test']);
  });

  it('keeps what is not an address apart', () => {
    expect(parseEmailList('ann@acme.test, ben').malformed).toEqual(['ben']);
  });
});

describe('checkEmailList', () => {
  it('names what is not an address', () => {
    expect(checkEmailList(parseEmailList('ben, cara@'))).toBe(
      'Not an email address: ben, cara@',
    );
  });

  it('needs at least one address', () => {
    expect(checkEmailList(parseEmailList(' , '))).toBe(
      'Add at least one email address.',
    );
  });

  it('refuses more than ten at once', () => {
    const eleven = Array.from({ length: 11 }, (_, i) => `p${i}@acme.test`);
    expect(checkEmailList(parseEmailList(eleven.join('\n')))).toBe(
      'You can invite up to 10 people at a time.',
    );
  });

  it('passes a good list', () => {
    expect(checkEmailList(parseEmailList('ann@acme.test'))).toBeUndefined();
  });
});
