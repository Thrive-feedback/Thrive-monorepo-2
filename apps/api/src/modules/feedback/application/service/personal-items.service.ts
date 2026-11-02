import { Injectable } from '@nestjs/common';
import { AskStatus } from '../../domain/value-object/ask-status.vo';
import {
  FeedbackRequestQuery,
  type ReceivedFeedbackPageRow,
  type ReceivedFeedbackRow,
} from '../query-port/feedback-request.query-port';
import { type KudosPageRow, KudosQuery } from '../query-port/kudos.query-port';
import type { KudosFeedItemView } from '../types/feed-items.types';
import type { People } from '../types/feedback-request.types';
import {
  type CursorPageRequest,
  type FeedPageRequest,
  type FeedPosition,
  newestFirst,
} from '../types/kudos.types';
import type {
  PersonalFeedbackView,
  PersonalItemsView,
} from '../types/personal-item.types';
import { PeopleService } from './people.service';

export interface PersonalItemsRead {
  readonly workspaceId: string;
  readonly page: CursorPageRequest;
  /** One page of this list's Feedback, past a place in it. */
  readonly feedback: (
    page: FeedPageRequest,
  ) => Promise<ReceivedFeedbackPageRow>;
  /** One page of this list's Kudos, past the same place. */
  readonly kudos: (page: FeedPageRequest) => Promise<KudosPageRow>;
}

const NOTHING_MORE: PersonalItemsView = { items: [], nextAfterId: null };

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
): PersonalFeedbackView {
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
 * One Member's own list, Received or Given: Feedback and Kudos in one order, newest first, each with
 * the card it was written on, under one cursor (ADR 0077, ADR 0080, ADR 0081). Which rows are in it
 * is the caller's to read, so this holds nothing about whose list it is.
 */
@Injectable()
export class PersonalItemsService {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly kudosQuery: KudosQuery,
    private readonly peopleService: PeopleService,
  ) {}

  async read(input: PersonalItemsRead): Promise<PersonalItemsView> {
    const after = await this.positionAfter(input);
    if (after === undefined) {
      return NOTHING_MORE;
    }
    const page: FeedPageRequest = { after, limit: input.page.limit };
    const [feedback, kudos] = await Promise.all([
      input.feedback(page),
      input.kudos(page),
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
  }: PersonalItemsRead): Promise<FeedPosition | null | undefined> {
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
