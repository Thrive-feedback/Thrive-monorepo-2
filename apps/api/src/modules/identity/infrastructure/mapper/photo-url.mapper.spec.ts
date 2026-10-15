import { describe, expect, it } from 'bun:test';
import { toPhotoUrl } from './photo-url.mapper';

describe('toPhotoUrl', () => {
  it('shows a photo Google stored as an https link', () => {
    const link = 'https://lh3.googleusercontent.com/a/abc=s96-c';

    expect(toPhotoUrl(link)).toBe(link);
  });

  it.each([
    ['no link', null],
    ['an empty link', ''],
    ['a link that is not a URL', 'not a url'],
    ['a plain http link', 'http://lh3.googleusercontent.com/a/abc'],
    ['a script link', 'javascript:alert(1)'],
  ])('shows no photo for %s', (_case, stored) => {
    expect(toPhotoUrl(stored)).toBeNull();
  });
});
