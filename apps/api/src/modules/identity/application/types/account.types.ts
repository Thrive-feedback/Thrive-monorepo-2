/** An Account as another person sees it: who it is, the name it introduced itself with, and its photo. */
export interface AccountSummaryView {
  readonly accountId: string;
  readonly email: string;
  /** `null` while the Account has not introduced itself. */
  readonly fullName: string | null;
  /** The name others see and call them by; `null` while the Account has not introduced itself. */
  readonly displayName: string | null;
  /** Their photo from Google; `null` when Google has none. */
  readonly photoUrl: string | null;
}

/** An Account as found by the address it signs in with. */
export interface AccountByEmailView {
  readonly accountId: string;
  readonly email: string;
}
