/** The signed-in person, as much of them as the sign-in screens need. */
export interface CurrentAccount {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}

/**
 * The caller's session as a read sees it. `needsRefresh` says the session has been in use
 * long enough to be pushed forward; the read itself never pushes it.
 */
export interface CurrentSession {
  /** `null` for no session, a forged one or an expired one. */
  readonly account: CurrentAccount | null;
  readonly needsRefresh: boolean;
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

export interface RefreshedSession {
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
  /** Reads the caller's session. Writes nothing, so it is safe on every page. */
  abstract currentSession(credential: string): Promise<CurrentSession>;

  /**
   * Pushes a live session forward and returns the cookie that matches its new expiry.
   * Without a live session it changes nothing and returns no session cookie.
   */
  abstract refreshSession(credential: string): Promise<RefreshedSession>;

  abstract startGoogleSignIn(): Promise<GoogleSignIn>;

  /** Ends the caller's session. Repeatable: with no session it still clears the cookie. */
  abstract signOut(credential: string): Promise<SignedOut>;
}
