import { describe, expect, it } from 'bun:test';
import { FakeIdentityPort } from '@test/support/identity.fakes';
import { StartGoogleSignInUseCase } from './start-google-sign-in.use-case';

const INVITATION_ID = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b';

describe('starting Google sign-in', () => {
  it("returns Google's URL and the state cookie untouched", async () => {
    const identityPort = new FakeIdentityPort();
    identityPort.googleSignIn = {
      url: 'https://accounts.google.test/auth?state=s1',
      sessionCookies: ['thrive.state=s1; Path=/; HttpOnly'],
    };
    const useCase = new StartGoogleSignInUseCase(identityPort);

    expect(await useCase.execute({ invitationId: null })).toEqual({
      url: 'https://accounts.google.test/auth?state=s1',
      sessionCookies: ['thrive.state=s1; Path=/; HttpOnly'],
    });
  });

  it('passes on the Invitation the person is signing in to accept', async () => {
    const identityPort = new FakeIdentityPort();
    const useCase = new StartGoogleSignInUseCase(identityPort);

    await useCase.execute({ invitationId: INVITATION_ID });

    expect(identityPort.calls).toEqual([
      { method: 'startGoogleSignIn', invitationId: INVITATION_ID },
    ]);
  });
});
