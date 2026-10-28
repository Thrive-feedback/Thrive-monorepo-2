import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import { toAnsweredRequest } from '@/lib/feedback/answered-request.util';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import { toFeedbackPerson } from '@/lib/feedback/feedback-person.util';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { readViewerAccountId, readYou } from '@/lib/session/session.service';

/** As on My requests: one page covers a Workspace of 20–50 people asking one another. */
const ONE_PAGE = { page: 1, pageSize: 100 };

/**
 * The Feedback written to the signed-in person, newest first, as cards: the reader first among
 * everyone it was for, named "you", then the others in the Giver's order. Whose it is is the
 * API's to decide from the session — it is not a parameter here, and cannot be.
 *
 * Not cached across requests — `cache` only shares one call between the two layouts Home
 * draws: a new piece arrives the moment somebody answers, and one person's Feedback must never
 * be served to another.
 */
export const readReceivedFeedback = cache(
  async (membership: CurrentMembership): Promise<FeedItem[]> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    const [viewerAccountId, you] = await Promise.all([
      readViewerAccountId(),
      readYou(),
    ]);
    const received = unwrap(
      await apiClient().GET('/v1/workspaces/{workspaceId}/feedback', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
          query: ONE_PAGE,
        },
        cache: 'no-store',
      }),
    );
    return received.items.map((feedback) => ({
      id: feedback.id,
      giverName: feedback.giverName,
      giverPhotoUrl: feedback.giverPhotoUrl,
      giverInactive: feedback.giverStatus === 'DEACTIVATED',
      // Nobody writes Feedback to themself, so the Giver is never the reader.
      giverIsYou: false,
      // The list leaves the reader out of who it was for; the card puts them back, first.
      receivers: [
        ...(you ? [you] : []),
        ...feedback.otherReceivers.map((person) =>
          toFeedbackPerson(person, viewerAccountId),
        ),
      ],
      origin: feedback.origin,
      message: feedback.message,
      messageTags: feedback.tags,
      givenAt: feedback.createdAt,
      // Reactions are #92; until then a card shows the four with nobody behind them.
      reactions: {},
      request: toAnsweredRequest(feedback.request, viewerAccountId),
    }));
  },
);
