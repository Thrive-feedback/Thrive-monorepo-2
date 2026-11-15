import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import type { Profile } from './profile.type';

/**
 * The Profile a slug names in the person's Workspace, or `null` when nobody who is or was a Member
 * there holds it. Never cached: a Role can change or someone be Deactivated at any moment.
 */
export async function readProfile(
  membership: CurrentMembership,
  slug: string,
): Promise<Profile | null> {
  try {
    const profile = unwrap(
      await apiClient().GET('/v1/workspaces/{workspaceId}/profiles/{slug}', {
        params: {
          path: { workspaceId: membership.workspace.id, slug },
          header: { cookie: (await headers()).get('cookie') ?? undefined },
        },
        cache: 'no-store',
      }),
    );
    return {
      accountId: profile.accountId,
      slug: profile.slug,
      name: profile.displayName,
      fullName: profile.fullName,
      email: profile.email,
      photoUrl: profile.photoUrl,
      role: profile.role,
      isDeactivated: profile.status === 'DEACTIVATED',
      joinedAt: profile.joinedAt,
    };
  } catch (error) {
    if (error instanceof ApiError && error.code === 'PROFILE_NOT_FOUND') {
      return null;
    }
    throw error;
  }
}
