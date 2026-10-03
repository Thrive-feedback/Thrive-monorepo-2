import {
  type CurrentSession,
  type GoogleSignIn,
  IdentityPort,
  type SessionCookies,
} from '@app/modules/identity/application/port/identity.port';

/**
 * A stand-in for the sign-in provider. Each answer is set by the test that needs it, and
 * every call is recorded with the credential it carried, so a test asserts what reached
 * the port rather than how.
 */
export class FakeIdentityPort extends IdentityPort {
  readonly calls: { readonly method: string; readonly credential?: string }[] =
    [];

  session: CurrentSession = { account: null, needsRefresh: false };
  googleSignIn: GoogleSignIn = {
    url: 'https://accounts.google.test/',
    sessionCookies: [],
  };
  refreshCookies: SessionCookies = [];
  signOutCookies: SessionCookies = [];

  async currentSession(credential: string): Promise<CurrentSession> {
    this.calls.push({ method: 'currentSession', credential });
    return this.session;
  }

  async refreshSession(credential: string) {
    this.calls.push({ method: 'refreshSession', credential });
    return { sessionCookies: this.refreshCookies };
  }

  async startGoogleSignIn(): Promise<GoogleSignIn> {
    this.calls.push({ method: 'startGoogleSignIn' });
    return this.googleSignIn;
  }

  async signOut(credential: string) {
    this.calls.push({ method: 'signOut', credential });
    return { sessionCookies: this.signOutCookies };
  }
}
