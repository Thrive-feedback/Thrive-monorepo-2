import { describe, expect, it } from 'bun:test';
import { FakeIdentityPort } from '@test/support/identity.fakes';
import { SignOutUseCase } from './sign-out.use-case';

describe('signing out', () => {
  it("ends the caller's session and returns the clearing cookie", async () => {
    const identityPort = new FakeIdentityPort();
    identityPort.signOutCookies = ['thrive.session_token=; Max-Age=0'];
    const useCase = new SignOutUseCase(identityPort);

    expect(await useCase.execute({ credential: 'cookie-a' })).toEqual({
      sessionCookies: ['thrive.session_token=; Max-Age=0'],
    });
    expect(identityPort.calls).toEqual([
      { method: 'signOut', credential: 'cookie-a' },
    ]);
  });
});
