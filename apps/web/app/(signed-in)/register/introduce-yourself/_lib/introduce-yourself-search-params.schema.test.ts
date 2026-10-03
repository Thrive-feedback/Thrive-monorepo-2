import { describe, expect, it } from 'vitest';
import { IntroduceYourselfSearchParams } from './introduce-yourself-search-params.schema';

describe('IntroduceYourselfSearchParams', () => {
  it('reads signedIn=1 from a sign-in', () => {
    expect(IntroduceYourselfSearchParams.parse({ signedIn: '1' })).toEqual({
      signedIn: '1',
    });
  });

  it('ignores any other signedIn value and any unknown param', () => {
    expect(
      IntroduceYourselfSearchParams.parse({ signedIn: 'yes', extra: 'x' }),
    ).toEqual({
      signedIn: undefined,
    });
  });
});
