import { describe, expect, it } from 'bun:test';
import { IdentityPort } from '../port/identity.port';
import { SignOutUseCase } from './sign-out.use-case';

class FakeIdentity extends IdentityPort {
  readonly signedOut: string[] = [];

  async currentAccount() {
    return null;
  }

  async startGoogleSignIn() {
    return { url: 'https://accounts.google.test/', sessionCookies: [] };
  }

  async signOut(credential: string) {
    this.signedOut.push(credential);
    return { sessionCookies: ['thrive.session_token=; Max-Age=0'] };
  }
}

describe('signing out', () => {
  it("ends the caller's session and returns the clearing cookie", async () => {
    const identity = new FakeIdentity();
    const useCase = new SignOutUseCase(identity);

    expect(await useCase.execute({ credential: 'cookie-a' })).toEqual({
      sessionCookies: ['thrive.session_token=; Max-Age=0'],
    });
    expect(identity.signedOut).toEqual(['cookie-a']);
  });
});
