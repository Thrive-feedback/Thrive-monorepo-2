import { describe, expect, it } from 'vitest';
import { HomeSearchParams } from './home-search-params.schema';

describe('HomeSearchParams', () => {
  it('reads signedIn=1 from a sign-in', () => {
    expect(HomeSearchParams.parse({ signedIn: '1' })).toEqual({
      signedIn: '1',
      sent: undefined,
      tab: 'workspace',
    });
  });

  it('reads sent=1 and the tab from a Feedback Request just sent', () => {
    expect(HomeSearchParams.parse({ tab: 'my-requests', sent: '1' })).toEqual({
      signedIn: undefined,
      sent: '1',
      tab: 'my-requests',
    });
  });

  it('opens the Workspace feed for a missing or unknown tab', () => {
    expect(HomeSearchParams.parse({}).tab).toBe('workspace');
    expect(HomeSearchParams.parse({ tab: 'nope' }).tab).toBe('workspace');
    expect(HomeSearchParams.parse({ tab: ['waiting', 'shared'] }).tab).toBe(
      'workspace',
    );
  });

  it('ignores any other signedIn or sent value and any unknown param', () => {
    expect(
      HomeSearchParams.parse({ signedIn: 'yes', sent: '2', extra: 'x' }),
    ).toEqual({
      signedIn: undefined,
      sent: undefined,
      tab: 'workspace',
    });
  });
});
