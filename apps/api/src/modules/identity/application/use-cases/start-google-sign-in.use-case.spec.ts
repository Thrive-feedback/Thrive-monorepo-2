import { describe, expect, it } from 'bun:test';
import { IdentityPort } from '../port/identity.port';
import { StartGoogleSignInUseCase } from './start-google-sign-in.use-case';

class FakeIdentity extends IdentityPort {
  async currentAccount() {
    return null;
  }

  async startGoogleSignIn() {
    return {
      url: 'https://accounts.google.test/auth?state=s1',
      sessionCookies: ['thrive.state=s1; Path=/; HttpOnly'],
    };
  }

  async signOut() {
    return { sessionCookies: [] };
  }
}

describe('starting Google sign-in', () => {
  it("returns Google's URL and the state cookie untouched", async () => {
    const useCase = new StartGoogleSignInUseCase(new FakeIdentity());

    expect(await useCase.execute()).toEqual({
      url: 'https://accounts.google.test/auth?state=s1',
      sessionCookies: ['thrive.state=s1; Path=/; HttpOnly'],
    });
  });
});
