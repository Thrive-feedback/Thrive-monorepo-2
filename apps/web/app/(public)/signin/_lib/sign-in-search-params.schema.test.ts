import { describe, expect, it } from 'vitest';
import { SignInSearchParams } from './sign-in-search-params.schema';

describe('SignInSearchParams', () => {
  it('reads the error a failed sign-in comes back with', () => {
    expect(SignInSearchParams.parse({ error: 'access_denied' })).toEqual({
      error: 'access_denied',
    });
  });

  it('ignores a malformed error and any unknown param', () => {
    expect(
      SignInSearchParams.parse({ error: ['a', 'b'], next: '/admin' }),
    ).toEqual({ error: undefined });
  });
});
