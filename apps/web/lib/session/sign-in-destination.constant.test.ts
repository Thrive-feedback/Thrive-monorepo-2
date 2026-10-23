import { describe, expect, it } from 'vitest';
import { toSignInDestination } from './sign-in-destination.constant';

const WAITING_ASK =
  '/home?tab=waiting&ask=0199a0f0-0000-7000-8000-000000000001';

describe('toSignInDestination', () => {
  it('is the page the link pointed at, query and all', () => {
    expect(toSignInDestination(WAITING_ASK)).toBe(WAITING_ASK);
  });

  it('is nowhere when the destination is not a path inside Thrive', () => {
    expect(toSignInDestination('https://evil.test/phish')).toBeNull();
  });

  // Landing on one of these would read as a fresh arrival from Google, and be followed again.
  it.each([
    '/home?signedIn=1',
    '/home?tab=waiting&signedIn=1',
    '/choose-workspace?signedIn=1',
    '/register/introduce-yourself?signedIn=1',
    '/home?signedIn=',
    '/home?signedIn',
  ])('refuses %j, which says it is itself the way back from Google', (path) => {
    expect(toSignInDestination(path)).toBeNull();
  });

  it('keeps a path whose query only looks like it', () => {
    expect(toSignInDestination('/home?tab=signedIn')).toBe(
      '/home?tab=signedIn',
    );
    expect(toSignInDestination('/signedIn')).toBe('/signedIn');
  });
});
