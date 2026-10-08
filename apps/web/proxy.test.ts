import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { config, proxy } from './proxy';

function visit(path: string, cookie?: string) {
  return proxy(
    new NextRequest(`http://localhost:3001${path}`, {
      headers: cookie ? { cookie } : {},
    }),
  );
}

describe('proxy', () => {
  it('sends a visitor with no session cookie to sign-in', () => {
    const response = visit('/register/introduce-yourself');

    expect(response.headers.get('location')).toBe(
      'http://localhost:3001/signin',
    );
  });

  it.each(['thrive.session_token=abc', '__Secure-thrive.session_token=abc'])(
    'lets %s through to the page, which checks it properly',
    (cookie) => {
      expect(visit('/home', cookie).headers.get('location')).toBeNull();
    },
  );

  it('guards only the signed-in pages, never sign-in or the public landing page', () => {
    expect(config.matcher).toEqual(['/home', '/register/:path*']);
  });
});
