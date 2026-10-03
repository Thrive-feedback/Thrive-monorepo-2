import { describe, expect, it } from 'bun:test';
import { IdentityPort } from '../port/identity.port';
import { GetCurrentAccountUseCase } from './get-current-account.use-case';

class FakeIdentityPort extends IdentityPort {
  readonly askedWith: string[] = [];

  constructor(private readonly sessions: Record<string, string>) {
    super();
  }

  async currentAccount(credential: string) {
    this.askedWith.push(credential);
    const email = this.sessions[credential];
    return email ? { email, name: 'Ann Lee' } : null;
  }

  async startGoogleSignIn() {
    return { url: 'https://accounts.google.test/', sessionCookies: [] };
  }

  async signOut() {
    return { sessionCookies: [] };
  }
}

describe('reading the current Account', () => {
  it('answers the Account behind the credential', async () => {
    const identityPort = new FakeIdentityPort({ 'cookie-a': 'ann@acme.test' });
    const useCase = new GetCurrentAccountUseCase(identityPort);

    expect(await useCase.execute({ credential: 'cookie-a' })).toEqual({
      email: 'ann@acme.test',
      name: 'Ann Lee',
    });
    expect(identityPort.askedWith).toEqual(['cookie-a']);
  });

  it('answers null when nobody is signed in', async () => {
    const useCase = new GetCurrentAccountUseCase(new FakeIdentityPort({}));

    expect(await useCase.execute({ credential: '' })).toBeNull();
  });
});
