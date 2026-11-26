import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import type { Meeting, NextMeeting } from './one-on-one-meeting.type';

/** How many finished meetings the panel reads; older ones come in a later slice. */
const PAST_READ = 20;

/**
 * A 1:1's next meeting: the one not finished, or what it will open with. Never cached: what the
 * other person wrote shows on Sync.
 */
export const readNextMeeting = cache(
  async (
    membership: CurrentMembership,
    oneOnOneId: string,
  ): Promise<NextMeeting> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    return unwrap(
      await apiClient().GET(
        '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/meetings/next',
        {
          params: {
            path: { workspaceId: membership.workspace.id, oneOnOneId },
            header: { cookie },
          },
          cache: 'no-store',
        },
      ),
    );
  },
);

/** A 1:1's finished meetings, newest first, each whole: its topics and the notes on them. */
export const readPastMeetings = cache(
  async (
    membership: CurrentMembership,
    oneOnOneId: string,
  ): Promise<readonly Meeting[]> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    const page = unwrap(
      await apiClient().GET(
        '/v1/workspaces/{workspaceId}/one-on-ones/{oneOnOneId}/meetings',
        {
          params: {
            path: { workspaceId: membership.workspace.id, oneOnOneId },
            header: { cookie },
            query: { limit: PAST_READ },
          },
          cache: 'no-store',
        },
      ),
    );
    return page.items;
  },
);
