import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import type { Teammate } from './teammate.type';

/** A Workspace holds 20–50 people, so one page of the largest size covers it. */
const ONE_PAGE = { page: 1, pageSize: 100 };

/**
 * Everyone in the person's Workspace but themselves, oldest Member first. Not cached: who is
 * in changes the moment someone accepts an Invitation, and one person's teammates must never
 * be served to another.
 *
 * Members are told apart by email rather than by Account id, because the session carries the
 * email and not the id.
 */
export async function readTeammates(
  membership: CurrentMembership,
  ownEmail: string,
): Promise<Teammate[]> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const members = await apiClient().GET(
    '/v1/workspaces/{workspaceId}/members',
    {
      params: {
        path: { workspaceId: membership.workspace.id },
        header: { cookie },
        query: ONE_PAGE,
      },
      cache: 'no-store',
    },
  );

  return unwrap(members)
    .items.filter((member) => member.email !== ownEmail)
    .map((member) => ({
      accountId: member.accountId,
      name: member.fullName ?? member.email,
    }));
}
