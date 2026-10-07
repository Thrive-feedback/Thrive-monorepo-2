import type { Profile } from '../entity/profile.entity';
import type { ProfileSlug } from '../value-object/profile-slug.vo';

export abstract class ProfileRepository {
  abstract findByAccountId(accountId: string): Promise<Profile | null>;

  /** Which of `slugs` another Profile already holds. One query, however many are asked. */
  abstract takenSlugs(slugs: readonly ProfileSlug[]): Promise<ProfileSlug[]>;

  /**
   * Stores a new Profile. Rejects with `ProfileSlugTakenError` when another Profile took
   * the slug since it was checked, and with `ProfileAlreadyExistsError` when the Account
   * gained a Profile in the meantime.
   */
  abstract save(profile: Profile): Promise<void>;
}
