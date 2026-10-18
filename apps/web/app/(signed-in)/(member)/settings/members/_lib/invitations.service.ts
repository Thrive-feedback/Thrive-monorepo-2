import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import type { OpenInvitation } from './open-invitation.type';

/** A Workspace holds 20–50 people, so one page of the largest size covers its Invitations. */
const ONE_PAGE = { page: 1, pageSize: 100 };

/**
 * The Invitations to the person's Workspace that nobody has accepted or revoked, newest first.
 * Only for Admins; the API refuses anyone else. Not cached: a resend or a revoke
 * changes it at once.
 */
export async function readInvitations(
  membership: CurrentMembership,
): Promise<OpenInvitation[]> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const invitations = await apiClient().GET(
    '/v1/workspaces/{workspaceId}/invitations',
    {
      params: {
        path: { workspaceId: membership.workspace.id },
        header: { cookie },
        query: ONE_PAGE,
      },
      cache: 'no-store',
    },
  );
  return unwrap(invitations).items.map((invitation) => ({
    invitationId: invitation.invitationId,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    invitedBy: invitation.invitedBy.displayName ?? invitation.invitedBy.email,
    invitedAt: invitation.invitedAt,
    expiresAt: invitation.expiresAt,
  }));
}
