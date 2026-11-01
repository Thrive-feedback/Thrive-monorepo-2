import { Injectable } from '@nestjs/common';
import { AskStatus } from '../../domain/value-object/ask-status.vo';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { KudosQuery } from '../query-port/kudos.query-port';
import { PeopleService } from '../service/people.service';
import type {
  FeedItemsView,
  KudosFeedItemView,
} from '../types/feed-items.types';
import type {
  FeedItemShow,
  FeedItemView,
} from '../types/feedback-request.types';
import {
  type CursorPageRequest,
  type FeedPageRequest,
  type FeedPosition,
  newestFirst,
} from '../types/kudos.types';

export interface ListFeedItemsInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Who is reading: the signed-in caller, always. Never read from the query. */
  readonly readerAccountId: string;
  readonly show: FeedItemShow;
  readonly page: CursorPageRequest;
}

const NOTHING_MORE: FeedItemsView = { items: [], nextAfterId: null };

/**
 * A query: what one Member reads on Home — Everyone, what they were selected to read, or both —
 * newest first, with both people named and an answer with its question and everyone asked.
 *
 * It builds no `Visibility`. The read applied it (ADR 0044), so there is nothing here that could
 * widen what came back, and the reader is an argument to that read rather than a filter after it
 * (`BE_21` R4). Home's two lists are one read so one cursor can page them (ADR 0071), and a Kudos,
 * which every Member reads and which has no Visibility, comes in from its own table under that same
 * cursor (ADR 0077).
 */
@Injectable()
export class ListFeedItemsUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly kudosQuery: KudosQuery,
    private readonly peopleService: PeopleService,
  ) {}

  async execute(input: ListFeedItemsInput): Promise<FeedItemsView> {
    const after = await this.positionAfter(input);
    if (after === undefined) {
      return NOTHING_MORE;
    }
    const page: FeedPageRequest = { after, limit: input.page.limit };
    const [feedItems, kudos] = await Promise.all([
      this.feedbackRequestQuery.feedItemsFor(
        input.workspaceId,
        input.readerAccountId,
        input.show,
        page,
      ),
      this.kudosQuery.onHome(
        input.workspaceId,
        page,
        // Shared with me is what names the reader. A Kudos for the whole Workspace names nobody.
        input.show === 'SHARED_WITH_ME' ? input.readerAccountId : null,
      ),
    ]);
    const people = await this.peopleService.peopleIn(input.workspaceId, [
      ...feedItems.items.flatMap((feedback) => [
        feedback.giverAccountId,
        ...feedback.receiverAccountIds,
        ...(feedback.request
          ? [
              feedback.request.requesterAccountId,
              ...feedback.request.asks.map((ask) => ask.giverAccountId),
            ]
          : []),
      ]),
      ...kudos.items.flatMap((each) => [
        each.giverAccountId,
        ...each.recipientAccountIds,
      ]),
    ]);

    const feedbackViews = feedItems.items.map(
      (feedback): FeedItemView => ({
        kind: 'FEEDBACK',
        id: feedback.id,
        origin: feedback.origin,
        feedbackRequestId: feedback.feedbackRequestId,
        giverAccountId: feedback.giverAccountId,
        // An Account cascades away with the person, so a missing one was deleted mid-read.
        giverName: people.nameOf(feedback.giverAccountId),
        giverPhotoUrl: people.photoOf(feedback.giverAccountId),
        giverStatus: people.statusOf(feedback.giverAccountId),
        receivers: feedback.receiverAccountIds.map(people.personOf),
        message: feedback.message,
        tags: feedback.tags,
        createdAt: feedback.createdAt,
        visibility: feedback.visibility,
        request: feedback.request && {
          message: feedback.request.message,
          tags: feedback.request.tags,
          requester: people.personOf(feedback.request.requesterAccountId),
          asked: feedback.request.asks.map((ask) => ({
            person: people.personOf(ask.giverAccountId),
            status: AskStatus.of(ask.status).toString(),
            answer: ask.answer,
          })),
        },
      }),
    );
    const kudosViews = kudos.items.map(
      (each): KudosFeedItemView => ({
        kind: 'KUDOS',
        id: each.id,
        giver: people.personOf(each.giverAccountId),
        recipients: each.recipientAccountIds.map(people.personOf),
        message: each.message,
        tags: each.tags,
        card: each.card,
        createdAt: each.createdAt,
      }),
    );

    // Each read holds a page, so this holds one more than a page whenever more remain of either.
    const merged = [...feedbackViews, ...kudosViews].sort(newestFirst);
    const items = merged.slice(0, input.page.limit);
    const hasMore =
      merged.length > items.length || feedItems.hasMore || kudos.hasMore;
    return {
      items,
      nextAfterId: hasMore ? (items.at(-1)?.id ?? null) : null,
    };
  }

  /**
   * Where the cursor's row sits, which can be in either table. `null` is the first page, and
   * `undefined` a cursor naming a row that is gone, which ends the list (ADR 0059).
   */
  private async positionAfter({
    workspaceId,
    page,
  }: ListFeedItemsInput): Promise<FeedPosition | null | undefined> {
    if (page.afterId === null) {
      return null;
    }
    const [feedback, kudos] = await Promise.all([
      this.feedbackRequestQuery.feedbackPositionOf(workspaceId, page.afterId),
      this.kudosQuery.positionOf(workspaceId, page.afterId),
    ]);
    return feedback ?? kudos ?? undefined;
  }
}
