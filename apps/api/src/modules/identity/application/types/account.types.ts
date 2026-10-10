/** An Account as another person sees it: who it is, and the name it introduced itself with. */
export interface AccountSummaryView {
  readonly accountId: string;
  readonly email: string;
  /** `null` while the Account has not introduced itself. */
  readonly fullName: string | null;
}
