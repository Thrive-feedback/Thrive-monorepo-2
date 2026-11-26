import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import type { OneOnOne, OneOnOneTemplate } from './one-on-one.type';
import { awaitsReadersAnswer } from './one-on-one-state.util';

/** More 1:1s than any one person keeps, so one read holds them all. */
const ONE_READ = 100;

/**
 * The 1:1s the person is in, in the order they were started, whoever sent the invitation: running
 * or waiting on an answer. Never cached across requests: an answer shows at once.
 */
export const readMyOneOnOnes = cache(
  async (membership: CurrentMembership): Promise<readonly OneOnOne[]> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    const page = unwrap(
      await apiClient().GET('/v1/workspaces/{workspaceId}/one-on-ones', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
          query: { limit: ONE_READ },
        },
        cache: 'no-store',
      }),
    );
    return page.items;
  },
);

/**
 * How many 1:1s wait on the person's answer, offered to them or asked of them, for the count on
 * the sidebar's 1:1s. A read that fails counts none, so the sidebar never fails with it.
 */
export async function readOneOnOnesToAnswer(
  membership: CurrentMembership,
): Promise<number> {
  try {
    return (await readMyOneOnOnes(membership)).filter(awaitsReadersAnswer)
      .length;
  } catch {
    return 0;
  }
}

/** The templates a 1:1's agenda can start from, Thrive's own first. */
export const readOneOnOneTemplates = cache(
  async (
    membership: CurrentMembership,
  ): Promise<readonly OneOnOneTemplate[]> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    const page = unwrap(
      await apiClient().GET(
        '/v1/workspaces/{workspaceId}/one-on-one-templates',
        {
          params: {
            path: { workspaceId: membership.workspace.id },
            header: { cookie },
          },
          cache: 'no-store',
        },
      ),
    );
    return page.items;
  },
);
