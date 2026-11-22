import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { HomeShow } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { API_SHOWS } from './home-feed.service';
import type { HomeWeekSummary } from './home-week.type';

/**
 * How much the reader's Home held on each of the last seven days, under the filter it shows. The
 * header and the feed both need it, so `cache` makes that one call per request; pass both the same
 * `membership`, which `cache` compares by identity. Nothing is cached across requests: the counts
 * change the moment somebody shares, and one reader's are not another's.
 */
export const readHomeWeek = cache(
  async (
    membership: CurrentMembership,
    show: HomeShow,
  ): Promise<HomeWeekSummary> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    const week = unwrap(
      await apiClient().GET('/v1/workspaces/{workspaceId}/feed-items/days', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
          query: { show: API_SHOWS[show] },
        },
        cache: 'no-store',
      }),
    );
    const toCounts = (counts: (typeof week)['totals']) => ({
      offered: counts.offeredFeedback,
      answers: counts.requestedFeedback,
      kudos: counts.kudos,
    });
    const today = week.days.at(-1)?.day;
    if (today === undefined) {
      throw new Error('The API counted no days of Home.');
    }
    return {
      today,
      days: week.days.map((day) => ({ day: day.day, ...toCounts(day) })),
      totals: toCounts(week.totals),
      countsKudos: show !== 'shared',
    };
  },
);

/**
 * The week, or `null` when the API could not count it. The counts dress Home rather than carry it,
 * so a failed count leaves the band without its sentence and ribbon and the list without its
 * counts and quiet days, and the cards still show. Anything but a refusal from the API is a fault of
 * our own and still fails the page.
 */
export async function readHomeWeekIfCounted(
  membership: CurrentMembership,
  show: HomeShow,
): Promise<HomeWeekSummary | null> {
  try {
    return await readHomeWeek(membership, show);
  } catch (error) {
    if (error instanceof ApiError) {
      return null;
    }
    throw error;
  }
}
