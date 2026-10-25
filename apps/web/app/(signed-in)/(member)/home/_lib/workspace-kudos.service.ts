import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { KudosItem } from '@/lib/feedback/kudos-item.type';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/** The first page, as large as the API allows, as the feed reads its Feedback today. */
const FIRST_PAGE = { limit: 100 };

/**
 * The Kudos of this Workspace, newest first, which every Member reads. Home draws both layouts,
 * so `cache` makes that one call; nothing is cached across requests.
 */
export const readWorkspaceKudos = cache(
  async (membership: CurrentMembership): Promise<KudosItem[]> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    const kudos = unwrap(
      await apiClient().GET('/v1/workspaces/{workspaceId}/kudos', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
          query: FIRST_PAGE,
        },
        cache: 'no-store',
      }),
    );
    return kudos.items.map((each) => ({
      id: each.id,
      giver: {
        name: each.giver.name,
        inactive: each.giver.status === 'DEACTIVATED',
      },
      recipients: each.recipients.map((recipient) => ({
        name: recipient.name,
        inactive: recipient.status === 'DEACTIVATED',
      })),
      message: each.message,
      messageTags: each.tags,
      givenAt: each.createdAt,
    }));
  },
);
