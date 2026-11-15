import type { Prisma } from '@app/infrastructure/database/generated/client';
import type { FeedItemShow } from '../../application/types/feedback-request.types';

/**
 * Which rows a Member's own lists hold, written once for the list that shows them and the count
 * beside it in the navigation, so the number can never promise something the list leaves out.
 * My requests is the exception: its list is read in SQL, a row per request with its answers
 * inside, so only its count reads `answersToRequestsByWhere`, and an integration test holds the two
 * to the same answers.
 */

/** What each choice on Home lets a reader see, always inside one Workspace. */
export function feedItemsWhere(
  workspaceId: string,
  readerAccountId: string,
  show: FeedItemShow,
): Prisma.FeedbackWhereInput {
  const everyone = { visibility: 'EVERYONE' } as const;
  // The join alone would answer this — a selected person exists only for SELECTED_PEOPLE, which
  // the Visibility itself holds — and the value is matched anyway, so a row left behind by any
  // other choice is unreadable rather than shared.
  const selected = {
    visibility: 'SELECTED_PEOPLE',
    selectedPeople: { some: { accountId: readerAccountId } },
  } as const;
  switch (show) {
    case 'EVERYONE':
      return { workspaceId, ...everyone };
    case 'SHARED_WITH_ME':
      return { workspaceId, ...selected };
    case 'ALL':
      return { workspaceId, OR: [everyone, selected] };
  }
}

/** The Asks still waiting on one Member: what Waiting for me lists. */
export function waitingAsksWhere(
  workspaceId: string,
  giverAccountId: string,
): Prisma.FeedbackAskWhereInput {
  return {
    giverAccountId,
    status: 'PENDING',
    feedbackRequest: { workspaceId },
  };
}

/**
 * The Feedback given to one Member unasked. Through the Receivers, not `feedback.receiverAccountId`:
 * that column holds only the first of several, and is kept for an older API mid-deploy (ADR 0061).
 */
export function offeredToWhere(
  workspaceId: string,
  receiverAccountId: string,
): Prisma.FeedbackWhereInput {
  return {
    workspaceId,
    origin: 'OFFERED',
    receivers: { some: { accountId: receiverAccountId } },
  };
}

/** Every answer to the requests one Member sent, which Received holds inside those requests. */
export function answersToRequestsByWhere(
  workspaceId: string,
  requesterAccountId: string,
): Prisma.FeedbackWhereInput {
  return {
    workspaceId,
    origin: 'REQUESTED',
    feedbackAsk: { feedbackRequest: { workspaceId, requesterAccountId } },
  };
}

/** The Kudos of one Workspace that name one Member. A Kudos naming nobody names nobody. */
export function kudosNamingWhere(
  workspaceId: string,
  recipientAccountId: string,
): Prisma.KudosWhereInput {
  return {
    workspaceId,
    recipients: { some: { accountId: recipientAccountId } },
  };
}
