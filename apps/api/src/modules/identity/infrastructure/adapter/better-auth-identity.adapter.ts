import { AUTH, type Auth } from '@app/infrastructure/auth/auth';
import { Inject, Injectable } from '@nestjs/common';
import {
  type CurrentSession,
  type GoogleSignIn,
  type GoogleSignInRequest,
  IdentityPort,
  type RefreshedSession,
  type SignedOut,
} from '../../application/port/identity.port';

/**
 * Where Google sends the person after the callback. Paths, not URLs: Better Auth resolves
 * them against its base URL, which is the web origin. `signedIn` tells the page it was
 * reached by signing in rather than by a visit, so it can say so once.
 */
const AFTER_SIGN_IN = '/home?signedIn=1';
const AFTER_FIRST_SIGN_IN = '/register/introduce-yourself?signedIn=1';
const AFTER_FAILED_SIGN_IN = '/signin';

/**
 * Back to the Invitation, whether or not the Account is new: accepting comes before
 * introducing yourself, and the Invitation page sends a new Account on to that step.
 */
function afterSignInToAccept(invitationId: string): string {
  return `/invitations/${encodeURIComponent(invitationId)}?signedIn=1`;
}

function requestHeaders(credential: string): Headers {
  return new Headers(credential ? { cookie: credential } : {});
}

/** The only file in Identity that knows Better Auth exists. */
@Injectable()
export class BetterAuthIdentityAdapter extends IdentityPort {
  constructor(@Inject(AUTH) private readonly auth: Auth) {
    super();
  }

  async currentSession(credential: string): Promise<CurrentSession> {
    // With `deferSessionRefresh` on, a GET reads without writing and reports whether the
    // session is due a refresh. An absent, forged or expired cookie comes back as `null`.
    const session = await this.auth.api.getSession({
      headers: requestHeaders(credential),
    });
    if (!session) {
      return { account: null, needsRefresh: false };
    }
    return {
      account: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      needsRefresh: 'needsRefresh' in session && session.needsRefresh === true,
    };
  }

  async refreshSession(credential: string): Promise<RefreshedSession> {
    // The same endpoint as POST is the one that writes: it pushes `expiresAt` forward when
    // the session is due, and sets the cookie that matches.
    const { headers } = await this.auth.api.getSession({
      headers: requestHeaders(credential),
      method: 'POST',
      returnHeaders: true,
    });
    return { sessionCookies: headers.getSetCookie() };
  }

  async startGoogleSignIn(request: GoogleSignInRequest): Promise<GoogleSignIn> {
    const afterInvitation =
      request.invitationId === null
        ? null
        : afterSignInToAccept(request.invitationId);
    const { headers, response } = await this.auth.api.signInSocial({
      body: {
        provider: 'google',
        callbackURL: afterInvitation ?? AFTER_SIGN_IN,
        newUserCallbackURL: afterInvitation ?? AFTER_FIRST_SIGN_IN,
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
