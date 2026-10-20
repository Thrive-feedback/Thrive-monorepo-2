/** A Member of the signed-in person's Workspace, as the picker shows them. */
export type Teammate = {
  readonly accountId: string;
  /** The name on their Profile, or their email while they have not introduced themselves. */
  readonly name: string;
  /** The slug a Mention writes them by, or `null` while they have not introduced themselves. */
  readonly slug: string | null;
  /** The name a Mention shows, or `null` while they have not introduced themselves. */
  readonly displayName: string | null;
};
