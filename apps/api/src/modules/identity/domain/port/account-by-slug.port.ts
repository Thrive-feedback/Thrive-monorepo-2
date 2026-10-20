/** An Account found by the slug its Profile holds. */
export interface AccountBySlug {
  readonly accountId: string;
  readonly slug: string;
  /** The name others see and call them by. */
  readonly displayName: string;
}

/**
 * Published: whose slugs several are, in one call. Another module asks it when a person is
 * named in text by slug, such as a Mention in Feedback.
 */
export abstract class AccountBySlugPort {
  /** One entry per slug a Profile holds. Others are left out. */
  abstract accountsWithSlugs(
    slugs: readonly string[],
  ): Promise<AccountBySlug[]>;
}
