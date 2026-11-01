import { Injectable } from '@nestjs/common';
import { AskStatus } from '../../domain/value-object/ask-status.vo';
import {
  FeedbackRequestQuery,
  type ReceivedFeedbackRow,
} from '../query-port/feedback-request.query-port';
import { KudosQuery } from '../query-port/kudos.query-port';
import { PeopleService } from '../service/people.service';
import type { KudosFeedItemView } from '../types/feed-items.types';
import type { People } from '../types/feedback-request.types';
import {
  type CursorPageRequest,
  type FeedPageRequest,
  type FeedPosition,
  newestFirst,
} from '../types/kudos.types';
import type {
  ReceivedFeedbackView,
  ReceivedItemsView,
} from '../types/received-item.types';

export interface ListReceivedItemsInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose Received list to read: the signed-in caller, always. Never read from the query. */
  readonly receiverAccountId: string;
  readonly page: CursorPageRequest;
}

const NOTHING_MORE: ReceivedItemsView = { items: [], nextAfterId: null };

function everyoneIn(row: ReceivedFeedbackRow): readonly string[] {
  return [
    row.giverAccountId,
    ...row.receiverAccountIds,
    ...(row.request
      ? [
          row.request.requesterAccountId,
          ...row.request.asks.map((ask) => ask.giverAccountId),
        ]
      : []),
  ];
}

function toFeedbackView(
  row: ReceivedFeedbackRow,
  people: People,
): ReceivedFeedbackView {
  return {
    kind: 'FEEDBACK',
    id: row.id,
    origin: row.origin,
    feedbackRequestId: row.feedbackRequestId,
    giverAccountId: row.giverAccountId,
    // An Account cascades away with the person, so a missing one was deleted mid-read.
    giverName: people.nameOf(row.giverAccountId),
    giverPhotoUrl: people.photoOf(row.giverAccountId),
    giverStatus: people.statusOf(row.giverAccountId),
    receivers: row.receiverAccountIds.map(people.personOf),
    message: row.message,
    tags: row.tags,
    createdAt: row.createdAt,
    visibility: row.visibility,
    postcard: row.postcard,
    request: row.request && {
      message: row.request.message,
      tags: row.request.tags,
      requester: people.personOf(row.request.requesterAccountId),
      asked: row.request.asks.map((ask) => ({
        person: people.personOf(ask.giverAccountId),
        status: AskStatus.of(ask.status).toString(),
        answer: ask.answer,
      })),
      postcard: row.request.postcard,
      answerPostcard: row.request.answerPostcard,
    },
  };
}

/**
 * A query: everything written to the caller in this Workspace, Feedback and the Kudos that name them
 * in one order, newest first, each with the card it was written on (ADR 0080).
 *
 * The Receiver is an argument to the reads rather than a filter applied after them, so a version of
 * this that lists somebody else's cannot be written by accident, which is the whole authorization
 * rule for this screen. A Member owns what was written to them: not even an Admin reads it.
 */
@Injectable()
export class ListReceivedItemsUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly kudosQuery: KudosQuery,
    private readonly peopleService: PeopleService,
  ) {}

  async execute(input: ListReceivedItemsInput): Promise<ReceivedItemsView> {
    const after = await this.positionAfter(input);
    if (after === undefined) {
      return NOTHING_MORE;
    }
    const page: FeedPageRequest = { after, limit: input.page.limit };
    const [feedback, kudos] = await Promise.all([
      this.feedbackRequestQuery.receivedItemsBy(
        input.workspaceId,
        input.receiverAccountId,
        page,
      ),
      // Naming the person leaves out a Kudos for the whole Workspace, which names nobody.
      this.kudosQuery.onHome(input.workspaceId, page, input.receiverAccountId),
    ]);
    const people = await this.peopleService.peopleIn(input.workspaceId, [
      ...feedback.items.flatMap(everyoneIn),
      ...kudos.items.flatMap((each) => [
        each.giverAccountId,
        ...each.recipientAccountIds,
      ]),
    ]);

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
    const feedbackViews = feedback.items.map((row) =>
      toFeedbackView(row, people),
    );

    // Each read holds a page, so this holds one more than a page whenever more remain of either.
    const merged = [...feedbackViews, ...kudosViews].sort(newestFirst);
    const items = merged.slice(0, input.page.limit);
    const hasMore =
      merged.length > items.length || feedback.hasMore || kudos.hasMore;
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
  }: ListReceivedItemsInput): Promise<FeedPosition | null | undefined> {
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
