import { describe, expect, it } from 'bun:test';
import { FakeIdentityPort } from '@test/support/identity.fakes';
import { StartGoogleSignInUseCase } from './start-google-sign-in.use-case';

describe('starting Google sign-in', () => {
  it("returns Google's URL and the state cookie untouched", async () => {
    const identityPort = new FakeIdentityPort();
    identityPort.googleSignIn = {
      url: 'https://accounts.google.test/auth?state=s1',
      sessionCookies: ['thrive.state=s1; Path=/; HttpOnly'],
    };
    const useCase = new StartGoogleSignInUseCase(identityPort);

    expect(await useCase.execute()).toEqual({
      url: 'https://accounts.google.test/auth?state=s1',
      sessionCookies: ['thrive.state=s1; Path=/; HttpOnly'],
    });
  });
});
