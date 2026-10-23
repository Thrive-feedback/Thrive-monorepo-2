import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { config, proxy } from './proxy';

const SESSION = 'thrive.session_token=abc';
const WAITING_ASK =
  '/home?tab=waiting&ask=0199a0f0-0000-7000-8000-000000000001';

function visit(path: string, cookie?: string) {
  return proxy(
    new NextRequest(`http://localhost:3001${path}`, {
      headers: cookie ? { cookie } : {},
    }),
  );
}

function comingBackFromGoogle(path: string, destination?: string) {
  return visit(
    path,
    destination === undefined
      ? SESSION
      : `${SESSION}; thrive.sign_in_destination=${encodeURIComponent(destination)}`,
  );
}

/** What the response tells the browser to do with the destination it was holding. */
function spent(response: ReturnType<typeof proxy>) {
  return response.cookies.get('thrive.sign_in_destination')?.value === '';
}

describe('turning a signed-out visitor away', () => {
  it('sends them to sign-in', () => {
    const response = visit('/register/introduce-yourself');

    expect(response.headers.get('location')).toBe(
      'http://localhost:3001/signin?next=%2Fregister%2Fintroduce-yourself',
    );
  });

  it('tells sign-in where they were going, query and all', () => {
    const response = visit(WAITING_ASK);

    expect(response.headers.get('location')).toBe(
      'http://localhost:3001/signin?next=%2Fhome%3Ftab%3Dwaiting%26ask%3D0199a0f0-0000-7000-8000-000000000001',
    );
  });

  it('says nothing about Home, which is where signing in lands anyway', () => {
    expect(visit('/home').headers.get('location')).toBe(
      'http://localhost:3001/signin',
    );
  });
});

describe('coming back from Google', () => {
  it('lands the person on the page the link pointed at', () => {
    const response = comingBackFromGoogle('/home?signedIn=1', WAITING_ASK);

    expect(response.headers.get('location')).toBe(
      `http://localhost:3001${WAITING_ASK}`,
    );
  });

  it('spends the destination, so Back reaches Home and nothing follows it twice', () => {
    expect(spent(comingBackFromGoogle('/home?signedIn=1', WAITING_ASK))).toBe(
      true,
    );
  });

  it.each([
    '/home?signedIn=1',
    '/choose-workspace?signedIn=1',
    'https://evil.test/phish',
  ])('refuses to follow %j, and spends it anyway', (destination) => {
    const response = comingBackFromGoogle('/home?signedIn=1', destination);

    expect(response.headers.get('location')).toBeNull();
    expect(spent(response)).toBe(true);
  });

  it('leaves someone who signed in from the landing page on Home, saying nothing', () => {
    const response = comingBackFromGoogle('/home?signedIn=1');

    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});

describe('a signed-in visit', () => {
  it.each(['thrive.session_token=abc', '__Secure-thrive.session_token=abc'])(
    'lets %s through to the page, which checks it properly',
    (cookie) => {
      expect(visit('/home', cookie).headers.get('location')).toBeNull();
    },
  );

  it('leaves a destination alone until the person comes back from Google', () => {
    const response = visit(
      '/home',
      `${SESSION}; thrive.sign_in_destination=%2Fsettings%2Fmembers`,
    );

    expect(response.headers.get('location')).toBeNull();
    expect(spent(response)).toBe(false);
  });
});

describe('what the proxy runs on', () => {
  it('guards the signed-in pages, never sign-in, the public landing page, or the address a chat tool returns an Admin to', () => {
    expect(config.matcher).toEqual([
      '/home',
      '/register/:path*',
      '/choose-workspace',
      '/settings',
      '/settings/((?!workspace/integrations/).*)',
    ]);
  });
});
