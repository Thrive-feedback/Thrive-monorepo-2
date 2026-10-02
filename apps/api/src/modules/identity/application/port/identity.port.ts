/** The signed-in person, as much of them as the sign-in screens need. */
export interface CurrentAccount {
  readonly email: string;
  readonly name: string;
}

/**
 * `Set-Cookie` values the provider wants the browser to hold. Opaque here: the application
 * passes them through without reading them, and the controller writes them onto the
 * response.
 */
export type SessionCookies = readonly string[];

export interface GoogleSignIn {
  /** Google's sign-in page, carrying the state and PKCE challenge for this attempt. */
  readonly url: string;
  readonly sessionCookies: SessionCookies;
}

export interface SignedOut {
  readonly sessionCookies: SessionCookies;
}

/**
 * Everything Identity asks of the sign-in provider. A `credential` is the request's
 * `cookie` header, opaque to everyone but the adapter, so replacing the provider means
 * rewriting one adapter and nothing above it.
 */
export abstract class IdentityPort {
  /** The Account behind a live session, or `null` for none, a forged or an expired one. */
  abstract currentAccount(credential: string): Promise<CurrentAccount | null>;

  abstract startGoogleSignIn(): Promise<GoogleSignIn>;

  /** Ends the caller's session. Repeatable: with no session it still clears the cookie. */
  abstract signOut(credential: string): Promise<SignedOut>;
}
