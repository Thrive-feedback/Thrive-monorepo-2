import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import {
  MEETING_CONTEXT_TABS,
  PROFILE_SHOW_OF,
  toContextCard,
} from './meeting-context.util';
import type {
  Meeting,
  MeetingContextCard,
  MeetingContextLookback,
  MeetingContextTab,
  MeetingContextTabView,
  MeetingContextView,
  NextMeeting,
  TemplateName,
} from './one-on-one-meeting.type';

/** How many finished meetings the panel reads; older ones come in a later slice. */
const PAST_READ = 20;

/** How many items of one tab Before you meet reads at a time: four pages of five. */
const CONTEXT_BATCH = 20;

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

/**
 * A 1:1's finished meetings, newest first, each whole: its topics and the notes on them; the meeting
 * days skipped, `YYYY-MM-DD`, oldest first; and what each template their topics came from is called.
 */
export const readPastMeetings = cache(
  async (
    membership: CurrentMembership,
    oneOnOneId: string,
  ): Promise<{
    readonly items: readonly Meeting[];
    readonly skippedDays: readonly string[];
    readonly templates: readonly TemplateName[];
  }> => {
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
    return {
      items: page.items,
      skippedDays: page.skippedDays,
      templates: page.templates,
    };
  },
);

/**
 * Before you meet, by tab: the other person's Profile as the reader reads it, each list from `since`
 * on (Open asks, every one still open), one batch each, and how many each holds. Read through the
 * Profile's own routes, so the two screens cannot disagree (brain ADR-0063, ADR 0098). Never cached,
 * as the next meeting is not.
 */
export const readMeetingContext = cache(
  async (
    membership: CurrentMembership,
    aboutAccountId: string,
    window: {
      readonly since: string;
      readonly lookback: MeetingContextLookback;
    },
  ): Promise<MeetingContextView> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    const path = {
      workspaceId: membership.workspace.id,
      accountId: aboutAccountId,
    };
    const [counts, ...pages] = await Promise.all([
      apiClient()
        .GET(
          '/v1/workspaces/{workspaceId}/members/{accountId}/profile-item-counts',
          {
            params: {
              path,
              header: { cookie },
              query: { since: window.since },
            },
            cache: 'no-store',
          },
        )
        .then(unwrap),
      ...MEETING_CONTEXT_TABS.map((tab) =>
        readContextPage(
          membership,
          aboutAccountId,
          tab,
          window.since,
          null,
          cookie,
        ),
      ),
    ]);
    const countOf: Readonly<Record<MeetingContextTab, number>> = {
      FEEDBACK: counts.feedback,
      KUDOS: counts.kudos,
      BETWEEN: counts.betweenUs,
      SHARED: counts.sharedWithMe,
      OPEN_ASKS: counts.openAsks,
    };
    const tabOf = (tab: MeetingContextTab): MeetingContextTabView => {
      const page = pages[MEETING_CONTEXT_TABS.indexOf(tab)];
      return {
        items: page?.items ?? [],
        count: countOf[tab],
        nextCursor: page?.nextCursor ?? null,
      };
    };
    return {
      ...window,
      tabs: {
        FEEDBACK: tabOf('FEEDBACK'),
        KUDOS: tabOf('KUDOS'),
        BETWEEN: tabOf('BETWEEN'),
        SHARED: tabOf('SHARED'),
        OPEN_ASKS: tabOf('OPEN_ASKS'),
      },
    };
  },
);

/**
 * One batch of one tab, past `cursor`. Open asks are never bounded by time, so `since` is not sent
 * for them, as the API refuses it there.
 */
export async function readContextPage(
  membership: CurrentMembership,
  aboutAccountId: string,
  tab: MeetingContextTab,
  since: string,
  cursor: string | null,
  cookie: string | undefined,
): Promise<{
  readonly items: readonly MeetingContextCard[];
  readonly nextCursor: string | null;
}> {
  const show = PROFILE_SHOW_OF[tab];
  const page = unwrap(
    await apiClient().GET(
      '/v1/workspaces/{workspaceId}/members/{accountId}/profile-items',
      {
        params: {
          path: {
            workspaceId: membership.workspace.id,
            accountId: aboutAccountId,
          },
          header: { cookie },
          query: {
            show,
            limit: CONTEXT_BATCH,
            ...(show === 'OPEN_ASKS' ? {} : { since }),
            ...(cursor ? { cursor } : {}),
          },
        },
        cache: 'no-store',
      },
    ),
  );
  return { items: page.items.map(toContextCard), nextCursor: page.nextCursor };
}
