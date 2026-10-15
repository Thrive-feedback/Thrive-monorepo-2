import { describe, expect, it } from 'vitest';
import { HomeSearchParams } from './home-search-params.schema';

describe('HomeSearchParams', () => {
  it('reads signedIn=1 from a sign-in', () => {
    expect(HomeSearchParams.parse({ signedIn: '1' })).toEqual({
      signedIn: '1',
      sent: undefined,
      given: undefined,
      tab: 'workspace',
      request: undefined,
      ask: undefined,
    });
  });

  it('reads sent=1 and the tab from a Feedback Request just sent', () => {
    expect(HomeSearchParams.parse({ tab: 'my-requests', sent: '1' })).toEqual({
      signedIn: undefined,
      sent: '1',
      given: undefined,
      tab: 'my-requests',
      request: undefined,
      ask: undefined,
    });
  });

  it('reads given=1 from Feedback just given without being asked', () => {
    expect(HomeSearchParams.parse({ given: '1' }).given).toBe('1');
    expect(HomeSearchParams.parse({ given: 'yes' }).given).toBeUndefined();
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
      given: undefined,
      tab: 'workspace',
      request: undefined,
      ask: undefined,
    });
  });

  it('reads the Feedback Request or Ask open in a dialog', () => {
    const id = '0199a0f0-0000-7000-8000-0000000000f1';

    expect(HomeSearchParams.parse({ tab: 'my-requests', request: id })).toEqual(
      expect.objectContaining({ tab: 'my-requests', request: id }),
    );
    expect(HomeSearchParams.parse({ tab: 'waiting', ask: id }).ask).toBe(id);
  });

  it('opens no dialog for a request or Ask that is not an id', () => {
    const parsed = HomeSearchParams.parse({
      request: 'nonsense',
      ask: ['a', 'b'],
    });

    expect(parsed.request).toBeUndefined();
    expect(parsed.ask).toBeUndefined();
  });
});
