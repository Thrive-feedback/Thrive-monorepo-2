/** The signed-in person, as the sign-in and register screens show them. */
export type Session = {
  readonly email: string;
  readonly name: string;
};
