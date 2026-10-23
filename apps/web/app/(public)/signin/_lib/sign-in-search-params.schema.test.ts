import { describe, expect, it } from 'vitest';
import { SignInSearchParams } from './sign-in-search-params.schema';

describe('SignInSearchParams', () => {
  it('reads the error a failed sign-in comes back with', () => {
    expect(SignInSearchParams.parse({ error: 'access_denied' })).toEqual({
      error: 'access_denied',
      next: null,
    });
  });

  it('ignores a malformed error and any unknown param', () => {
    expect(
      SignInSearchParams.parse({ error: ['a', 'b'], tab: 'waiting' }),
    ).toEqual({ error: undefined, next: null });
  });

  it('reads where the person was going, query and all', () => {
    expect(
      SignInSearchParams.parse({
        next: '/home?tab=waiting&ask=0199a0f0-0000-7000-8000-000000000001',
      }).next,
    ).toBe('/home?tab=waiting&ask=0199a0f0-0000-7000-8000-000000000001');
  });

  it.each([
    'https://evil.test/phish',
    '//evil.test',
    '/\\evil.test',
    'javascript:alert(1)',
    '%2F%2Fevil.test',
    '/..//evil.test',
    // Following this would read as a fresh arrival from Google and be followed again.
    '/home?signedIn=1',
  ])('drops %j, which is not a path signing in may land on', (next) => {
    expect(SignInSearchParams.parse({ next }).next).toBeNull();
  });

  it('drops a destination given twice', () => {
    expect(
      SignInSearchParams.parse({ next: ['/home', '/settings'] }).next,
    ).toBeNull();
  });
});
