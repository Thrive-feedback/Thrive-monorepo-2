import { describe, expect, it } from 'bun:test';
import { FakeIdentityPort } from '@test/support/identity.fakes';
import { GetCurrentSessionUseCase } from './get-current-session.use-case';

describe('reading the current session', () => {
  it('answers the Account and whether the session is due a refresh', async () => {
    const identityPort = new FakeIdentityPort();
    identityPort.session = {
      account: { email: 'ann@acme.test', name: 'Ann Lee' },
      needsRefresh: true,
    };
    const useCase = new GetCurrentSessionUseCase(identityPort);

    expect(await useCase.execute({ credential: 'cookie-a' })).toEqual({
      account: { email: 'ann@acme.test', name: 'Ann Lee' },
      needsRefresh: true,
    });
    expect(identityPort.calls).toEqual([
      { method: 'currentSession', credential: 'cookie-a' },
    ]);
  });

  it('answers no Account when nobody is signed in, and only reads', async () => {
    const identityPort = new FakeIdentityPort();
    const useCase = new GetCurrentSessionUseCase(identityPort);

    expect(await useCase.execute({ credential: '' })).toEqual({
      account: null,
      needsRefresh: false,
    });
    expect(identityPort.calls.map((call) => call.method)).toEqual([
      'currentSession',
    ]);
  });
});
