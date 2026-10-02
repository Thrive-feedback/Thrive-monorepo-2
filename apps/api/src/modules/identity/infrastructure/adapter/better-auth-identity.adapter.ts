import { AUTH, type Auth } from '@app/infrastructure/auth/auth';
import { Inject, Injectable } from '@nestjs/common';
import {
  type CurrentAccount,
  type GoogleSignIn,
  IdentityPort,
  type SignedOut,
} from '../../application/port/identity.port';

/**
 * Where Google sends the person after the callback. Paths, not URLs: Better Auth resolves
 * them against its base URL, which is the web origin. `signedIn` tells the page it was
 * reached by signing in rather than by a visit, so it can say so once.
 */
const AFTER_SIGN_IN = '/home?signedIn=1';
const AFTER_FIRST_SIGN_IN = '/register/introduce-yourself?signedIn=1';
const AFTER_FAILED_SIGN_IN = '/login';

function requestHeaders(credential: string): Headers {
  return new Headers(credential ? { cookie: credential } : {});
}

/** The only file in Identity that knows Better Auth exists. */
@Injectable()
export class BetterAuthIdentityAdapter extends IdentityPort {
  constructor(@Inject(AUTH) private readonly auth: Auth) {
    super();
  }

  async currentAccount(credential: string): Promise<CurrentAccount | null> {
    // An absent, forged or expired cookie all come back as `null`, never as an error.
    const session = await this.auth.api.getSession({
      headers: requestHeaders(credential),
    });
    return session
      ? { email: session.user.email, name: session.user.name }
      : null;
  }

  async startGoogleSignIn(): Promise<GoogleSignIn> {
    const { headers, response } = await this.auth.api.signInSocial({
      body: {
        provider: 'google',
        callbackURL: AFTER_SIGN_IN,
        newUserCallbackURL: AFTER_FIRST_SIGN_IN,
        errorCallbackURL: AFTER_FAILED_SIGN_IN,
        // The web server, not the browser, receives this answer, so it gets the URL to
        // redirect to rather than a redirect it would have to follow.
        disableRedirect: true,
      },
      returnHeaders: true,
    });
    if (!response.url) {
      throw new Error('Better Auth returned no Google sign-in URL.');
    }
    return { url: response.url, sessionCookies: headers.getSetCookie() };
  }

  async signOut(credential: string): Promise<SignedOut> {
    const { headers } = await this.auth.api.signOut({
      headers: requestHeaders(credential),
      returnHeaders: true,
    });
    return { sessionCookies: headers.getSetCookie() };
  }
}
