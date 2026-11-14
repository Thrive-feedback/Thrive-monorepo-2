import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import type {
  FeedbackSummary,
  FeedbackSummaryOnTheWire,
  SummarySectionName,
} from './feedback-summary.type';

/** What each block is called on screen, in reading order. */
const SECTION_TITLES: Readonly<Record<SummarySectionName, string>> = {
  themes: 'What runs through it',
  strengths: 'What people keep praising',
  areas_to_improve: 'What people keep asking for',
  suggested_actions: 'A few things to try',
};

const SECTION_ORDER = Object.keys(SECTION_TITLES) as SummarySectionName[];

/**
 * The signed-in person's own summary of a period, or `null` when none is written yet — either
 * because too little has been said for one to be worth writing, or because the one that was asked
 * for has not been written yet.
 *
 * **Whose it is is the API's to decide from the session**, so it is not a parameter here and
 * cannot be. Nothing is cached: one person's summary must never be served to another, and reading
 * it is also what asks for a newer one when the one stored has fallen behind.
 */
async function readMyFeedbackSummary(
  membership: CurrentMembership,
): Promise<FeedbackSummary | null> {
  const { summary } = unwrap(
    await apiClient().GET('/v1/workspaces/{workspaceId}/me/summary', {
      params: {
        path: { workspaceId: membership.workspace.id },
        header: { cookie: (await headers()).get('cookie') ?? undefined },
      },
      cache: 'no-store',
    }),
  );
  return summary === null ? null : toFeedbackSummary(summary);
}

/** The summary, or `null` when the API could not give it, as the page draws both the same way. */
export async function readMyFeedbackSummaryOrNothing(
  membership: CurrentMembership,
): Promise<FeedbackSummary | null> {
  try {
    return await readMyFeedbackSummary(membership);
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return null;
  }
}

function toFeedbackSummary(summary: FeedbackSummaryOnTheWire): FeedbackSummary {
  return {
    period: summary.period,
    generatedAt: summary.generatedAt,
    isStale: summary.isStale,
    sourceCount: summary.sourceCount,
    sections: SECTION_ORDER.map((name) => ({
      name,
      title: SECTION_TITLES[name],
      points: summary[name],
    })),
  };
}
