import { Injectable } from '@nestjs/common';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { KudosQuery } from '../query-port/kudos.query-port';
import type { ProfileItemCountsView } from '../types/personal-item.types';

export interface CountProfileItemsInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose Profile it is: anyone, the caller included. */
  readonly accountId: string;
  /** Who is reading: the signed-in caller, always. Never read from the query. */
  readonly readerAccountId: string;
  /** Count only what was written at or after this instant, or everything for `null`. */
  readonly since: Date | null;
}

/**
 * A query: how many items each of a Profile's lists holds for this reader, from `since` on, and how
 * many Asks are open between the two whenever they were asked (ADR 0097). Each number counts its
 * list with the list's own filter. A Profile shows no counts; a 1:1 reads these for the window since
 * its last meeting. On one's own Profile the reader's own lists hold nothing.
 */
@Injectable()
export class CountProfileItemsUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly kudosQuery: KudosQuery,
  ) {}

  async execute(input: CountProfileItemsInput): Promise<ProfileItemCountsView> {
    const { workspaceId, accountId, since } = input;
    // Nothing is between a Member and themselves, so on their own Profile only what everyone sees
    // is counted.
    const reader =
      input.readerAccountId === accountId ? null : input.readerAccountId;
    const [feedback, kudos] = await Promise.all([
      this.feedbackRequestQuery.profileCounts(
        workspaceId,
        reader,
        accountId,
        since,
      ),
      this.kudosQuery.profileCounts(workspaceId, reader, accountId, since),
    ]);
    return {
      feedback: feedback.everyoneFeedback,
      kudos: kudos.naming,
      betweenUs: feedback.feedbackBetween + kudos.between,
      sharedWithMe: feedback.sharedFeedback,
      openAsks: feedback.openAsks,
    };
  }
}
