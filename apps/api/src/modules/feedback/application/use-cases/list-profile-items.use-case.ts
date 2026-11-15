import { Injectable } from '@nestjs/common';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { KudosQuery } from '../query-port/kudos.query-port';
import { PersonalItemsService } from '../service/personal-items.service';
import type { CursorPageRequest, FeedPageRequest } from '../types/kudos.types';
import type {
  PersonalItemsView,
  ProfileItemShow,
} from '../types/personal-item.types';

export interface ListProfileItemsInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose Profile it is: anyone, the caller included. */
  readonly accountId: string;
  /** Who is reading: the signed-in caller, always. Never read from the query. */
  readonly readerAccountId: string;
  readonly show: ProfileItemShow;
  readonly page: CursorPageRequest;
}

/**
 * A query: what a Profile shows of what was written to one Member in this Workspace, newest first,
 * each with the card it was written on — the Feedback given to them that the whole Workspace reads,
 * asked for or not; the Feedback given to them that somebody selected the reader to read; or the
 * Kudos that name them.
 *
 * The reader already reads all of it on Home and on the Kudos board, so a Profile shows nothing new,
 * only gathers it by person. What everyone reads is the same for every reader; what was shared is
 * the reader's own, and empty for the Member themselves, whose other Feedback is in their Received.
 * The reader is an argument to that read rather than a filter after it.
 */
@Injectable()
export class ListProfileItemsUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly kudosQuery: KudosQuery,
    private readonly personalItemsService: PersonalItemsService,
  ) {}

  async execute(input: ListProfileItemsInput): Promise<PersonalItemsView> {
    const after = await this.personalItemsService.positionAfter(
      input.workspaceId,
      input.page.afterId,
    );
    if (after === undefined) {
      return { items: [], nextAfterId: null };
    }
    const { workspaceId, accountId } = input;
    const shown = await this.personalItemsService.read({
      workspaceId,
      after,
      limit: input.page.limit,
      feedback: this.feedbackOf(input),
      // Naming the person leaves out a Kudos for the whole Workspace, which names nobody.
      kudos:
        input.show === 'KUDOS'
          ? (page) => this.kudosQuery.onHome(workspaceId, page, accountId)
          : undefined,
    });
    return { items: shown.items, nextAfterId: shown.next?.id ?? null };
  }

  /** The read of the Feedback a list holds, or none for the Kudos. */
  private feedbackOf({
    workspaceId,
    accountId,
    readerAccountId,
    show,
  }: ListProfileItemsInput) {
    switch (show) {
      case 'FEEDBACK':
        return (page: FeedPageRequest) =>
          this.feedbackRequestQuery.everyoneFeedbackTo(
            workspaceId,
            accountId,
            page,
          );
      case 'SHARED_WITH_ME':
        return (page: FeedPageRequest) =>
          this.feedbackRequestQuery.sharedFeedbackTo(
            workspaceId,
            accountId,
            readerAccountId,
            page,
          );
      case 'KUDOS':
        return undefined;
    }
  }
}
