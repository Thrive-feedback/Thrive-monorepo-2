import {
  type CurrentSession,
  type GoogleSignIn,
  IdentityPort,
  type SessionCookies,
} from '@app/modules/identity/application/port/identity.port';
import {
  ProfileAlreadyExistsError,
  ProfileSlugTakenError,
} from '@app/modules/identity/application/profile.errors';
import { ProfileQuery } from '@app/modules/identity/application/query-port/profile.query-port';
import type { ProfileView } from '@app/modules/identity/application/types/profile.types';
import {
  Profile,
  type ProfileSnapshot,
} from '@app/modules/identity/domain/entity/profile.entity';
import { ProfileRepository } from '@app/modules/identity/domain/repository/profile-repository.port';
import { ProfileSlug } from '@app/modules/identity/domain/value-object/profile-slug.vo';

/**
 * A stand-in for the sign-in provider. Each answer is set by the test that needs it, and
 * every call is recorded with the credential it carried, so a test asserts what reached
 * the port rather than how.
 */
export class FakeIdentityPort extends IdentityPort {
  readonly calls: { readonly method: string; readonly credential?: string }[] =
    [];

  session: CurrentSession = { account: null, needsRefresh: false };
  googleSignIn: GoogleSignIn = {
    url: 'https://accounts.google.test/',
    sessionCookies: [],
  };
  refreshCookies: SessionCookies = [];
  signOutCookies: SessionCookies = [];

  async currentSession(credential: string): Promise<CurrentSession> {
    this.calls.push({ method: 'currentSession', credential });
    return this.session;
  }

  async refreshSession(credential: string) {
    this.calls.push({ method: 'refreshSession', credential });
    return { sessionCookies: this.refreshCookies };
  }

  async startGoogleSignIn(): Promise<GoogleSignIn> {
    this.calls.push({ method: 'startGoogleSignIn' });
    return this.googleSignIn;
  }

  async signOut(credential: string) {
    this.calls.push({ method: 'signOut', credential });
    return { sessionCookies: this.signOutCookies };
  }
}

/** A stored Profile, with any field the test cares about overridden. */
export function aProfileSnapshot(
  overrides: Partial<ProfileSnapshot> = {},
): ProfileSnapshot {
  return {
    id: '0199a0f0-0000-7000-8000-000000000001',
    accountId: 'account-ann',
    fullName: 'Ann Lee',
    displayName: 'Ann',
    slug: 'ann.lee',
    ...overrides,
  };
}

/**
 * Profiles held in memory, with the same uniqueness the database enforces. `slugsTakenOnSave`
 * plays another person saving the same slug between the check and the save.
 */
export class FakeProfileRepository extends ProfileRepository {
  readonly saved: ProfileSnapshot[] = [];
  readonly slugsTakenOnSave: string[] = [];

  holding(...snapshots: ProfileSnapshot[]): this {
    this.saved.push(...snapshots);
    return this;
  }

  async findByAccountId(accountId: string): Promise<Profile | null> {
    const found = this.saved.find((p) => p.accountId === accountId);
    return found ? Profile.restore(found) : null;
  }

  async takenSlugs(slugs: readonly ProfileSlug[]): Promise<ProfileSlug[]> {
    const held = new Set(this.saved.map((p) => p.slug));
    return slugs.filter((slug) => held.has(slug.toString()));
  }

  async save(profile: Profile): Promise<void> {
    const snapshot = profile.snapshot();
    const raced = this.slugsTakenOnSave.shift();
    if (raced !== undefined) {
      this.saved.push(
        aProfileSnapshot({
          id: `raced-${raced}`,
          accountId: `raced-${raced}`,
          slug: raced,
        }),
      );
    }
    if (this.saved.some((p) => p.accountId === snapshot.accountId)) {
      throw new ProfileAlreadyExistsError();
    }
    if (this.saved.some((p) => p.slug === snapshot.slug)) {
      throw new ProfileSlugTakenError();
    }
    this.saved.push(snapshot);
  }
}

export class FakeProfileQuery extends ProfileQuery {
  readonly profiles = new Map<string, ProfileView>();

  async profileOfAccount(accountId: string): Promise<ProfileView | null> {
    return this.profiles.get(accountId) ?? null;
  }
}
