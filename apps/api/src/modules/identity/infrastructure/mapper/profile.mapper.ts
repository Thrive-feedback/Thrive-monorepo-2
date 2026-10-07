import type { Profile as ProfileRecord } from '@app/infrastructure/database/generated/client';
import { Profile } from '../../domain/entity/profile.entity';

/** The only place that knows both the stored `profile` row and the Profile entity. */

export function toProfile(record: ProfileRecord): Profile {
  return Profile.restore({
    id: record.id,
    accountId: record.accountId,
    fullName: record.fullName,
    displayName: record.displayName,
    slug: record.slug,
  });
}

/** The audit timestamps are the database's to set. */
export function toProfileRecord(
  profile: Profile,
): Omit<ProfileRecord, 'createdAt' | 'updatedAt'> {
  const snapshot = profile.snapshot();
  return {
    id: snapshot.id,
    accountId: snapshot.accountId,
    fullName: snapshot.fullName,
    displayName: snapshot.displayName,
    slug: snapshot.slug,
  };
}
