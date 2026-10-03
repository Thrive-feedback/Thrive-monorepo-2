import { describe, expect, it } from 'bun:test';
import { FakeIdentityPort } from '@test/support/identity.fakes';
import { RefreshSessionUseCase } from './refresh-session.use-case';

describe('refreshing the session', () => {
  it("pushes the caller's session forward and returns the new cookie untouched", async () => {
    const identityPort = new FakeIdentityPort();
    identityPort.refreshCookies = [
      'thrive.session_token=abc.sig; Max-Age=604800; Path=/; HttpOnly',
    ];
    const useCase = new RefreshSessionUseCase(identityPort);

    expect(await useCase.execute({ credential: 'cookie-a' })).toEqual({
      sessionCookies: [
        'thrive.session_token=abc.sig; Max-Age=604800; Path=/; HttpOnly',
      ],
    });
    expect(identityPort.calls).toEqual([
      { method: 'refreshSession', credential: 'cookie-a' },
    ]);
  });
});
