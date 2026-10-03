import { describe, expect, it } from 'vitest';
import { LoginSearchParams } from './login-search-params.schema';

describe('LoginSearchParams', () => {
  it('reads the error a failed sign-in comes back with', () => {
    expect(LoginSearchParams.parse({ error: 'access_denied' })).toEqual({
      error: 'access_denied',
    });
  });

  it('ignores a malformed error and any unknown param', () => {
    expect(
      LoginSearchParams.parse({ error: ['a', 'b'], next: '/admin' }),
    ).toEqual({ error: undefined });
  });
});
