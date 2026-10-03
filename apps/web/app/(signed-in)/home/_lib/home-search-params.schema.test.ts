import { describe, expect, it } from 'vitest';
import { HomeSearchParams } from './home-search-params.schema';

describe('HomeSearchParams', () => {
  it('reads signedIn=1 from a sign-in', () => {
    expect(HomeSearchParams.parse({ signedIn: '1' })).toEqual({
      signedIn: '1',
    });
  });

  it('ignores any other signedIn value and any unknown param', () => {
    expect(HomeSearchParams.parse({ signedIn: 'yes', extra: 'x' })).toEqual({
      signedIn: undefined,
    });
  });
});
