import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { readMembers } from '../../_lib/members.service';
import type { WorkspaceConnection } from './connection.type';

/** One Connection per chat tool, so one page of any size covers them. */
const ONE_PAGE = { page: 1, pageSize: 100 };

/** Said in place of a name when whoever connected it is no longer an active Member. */
const SOMEONE_WHO_HAS_LEFT = 'a Member who has left';

/**
 * The chat tools the person's Workspace posts into, oldest first. Open to every Member, not
 * only Admins: the channel's name is not a secret, and a Member being able to see that their
 * Workspace posts into `#general` is the honest half of the audience risk brain `ADR-0035`
 * records. Not cached: connecting or reconnecting changes it at once.
 *
 * The API names who connected it by Account, as every module does, so the name comes from the
 * Workspace's Members, read through Settings' own shared service.
 */
export async function readConnections(
  membership: CurrentMembership,
): Promise<WorkspaceConnection[]> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const [connections, members] = await Promise.all([
    apiClient().GET('/v1/workspaces/{workspaceId}/integrations', {
      params: {
        path: { workspaceId: membership.workspace.id },
        header: { cookie },
        query: ONE_PAGE,
      },
      cache: 'no-store',
    }),
    readMembers(membership),
  ]);
  const nameOf = new Map(
    members.map((member) => [member.accountId, member.name ?? member.email]),
  );
  return unwrap(connections).items.map((connection) => ({
    provider: connection.provider,
    spaceName: connection.externalWorkspaceName,
    channelName: connection.externalChannelName,
    connectedBy:
      nameOf.get(connection.connectedByAccountId) ?? SOMEONE_WHO_HAS_LEFT,
    connectedAt: connection.connectedAt,
  }));
}
