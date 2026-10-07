import { DisplayName } from '../value-object/display-name.vo';
import { FullName } from '../value-object/full-name.vo';
import { ProfileSlug } from '../value-object/profile-slug.vo';

export interface ProfileSnapshot {
  readonly id: string;
  readonly accountId: string;
  readonly fullName: string;
  readonly displayName: string;
  readonly slug: string;
}

/**
 * An Account's personal details shown to others, the same in every Workspace. It exists
 * from the moment the person introduces themselves, so an Account without one has not
 * finished registering. The slug is fixed at that moment; renaming never changes it.
 */
export class Profile {
  private constructor(
    private readonly id: string,
    private readonly accountId: string,
    private readonly fullName: FullName,
    private readonly displayName: DisplayName,
    private readonly slug: ProfileSlug,
  ) {}

  static introduce(details: {
    readonly id: string;
    readonly accountId: string;
    readonly fullName: FullName;
    readonly displayName: DisplayName;
    readonly slug: ProfileSlug;
  }): Profile {
    return new Profile(
      details.id,
      details.accountId,
      details.fullName,
      details.displayName,
      details.slug,
    );
  }

  /** Rebuilds a stored Profile. */
  static restore(snapshot: ProfileSnapshot): Profile {
    return new Profile(
      snapshot.id,
      snapshot.accountId,
      FullName.of(snapshot.fullName),
      DisplayName.of(snapshot.displayName),
      ProfileSlug.of(snapshot.slug),
    );
  }

  snapshot(): ProfileSnapshot {
    return {
      id: this.id,
      accountId: this.accountId,
      fullName: this.fullName.toString(),
      displayName: this.displayName.toString(),
      slug: this.slug.toString(),
    };
  }
}
