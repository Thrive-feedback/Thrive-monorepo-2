import { describe, expect, it } from 'vitest';
import { parseSetCookie } from './set-cookie.util';

describe('parseSetCookie', () => {
  it('keeps every attribute the browser needs', () => {
    expect(
      parseSetCookie(
        'thrive.state=abc; Max-Age=300; Path=/; HttpOnly; Secure; SameSite=Lax',
      ),
    ).toEqual({
      name: 'thrive.state',
      value: 'abc',
      options: {
        maxAge: 300,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      },
    });
  });

  it('decodes a signed value, so encoding it again gives back what the API sent', () => {
    const sent = encodeURIComponent('token.sig+na/ture==');

    const cookie = parseSetCookie(`thrive.session_token=${sent}; Path=/`);

    expect(cookie?.value).toBe('token.sig+na/ture==');
    expect(encodeURIComponent(cookie?.value ?? '')).toBe(sent);
  });

  it('reads a clearing cookie as an empty value that expires now', () => {
    expect(
      parseSetCookie('thrive.session_token=; Max-Age=0; Path=/; HttpOnly'),
    ).toEqual({
      name: 'thrive.session_token',
      value: '',
      options: { maxAge: 0, path: '/', httpOnly: true },
    });
  });

  it('keeps an expiry date', () => {
    expect(
      parseSetCookie('a=1; Expires=Thu, 01 Jan 2099 00:00:00 GMT')?.options
        .expires,
    ).toEqual(new Date('2099-01-01T00:00:00Z'));
  });

  it('ignores a header with no name', () => {
    expect(parseSetCookie('=value; Path=/')).toBeNull();
  });
});
