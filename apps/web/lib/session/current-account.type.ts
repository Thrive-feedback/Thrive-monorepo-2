/** What a person told Thrive when they introduced themselves. */
export type CurrentProfile = {
  readonly fullName: string;
  readonly displayName: string;
  readonly slug: string;
};

/** The signed-in Account, as the sign-in and register screens show it. */
export type CurrentAccount = {
  readonly email: string;
  /** The name Google gave, which pre-fills Introduce yourself. */
  readonly name: string;
  /** `null` until the person has introduced themselves. */
  readonly profile: CurrentProfile | null;
};
