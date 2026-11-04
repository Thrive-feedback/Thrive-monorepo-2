import { Injectable } from '@nestjs/common';
import { AskStatus } from '../../domain/value-object/ask-status.vo';
import {
  FeedbackRequestQuery,
  type ReceivedFeedbackPageRow,
  type ReceivedFeedbackRow,
  type SentRequestItemPageRow,
  type SentRequestItemRow,
} from '../query-port/feedback-request.query-port';
import { type KudosPageRow, KudosQuery } from '../query-port/kudos.query-port';
import type { KudosFeedItemView } from '../types/feed-items.types';
import type { People } from '../types/feedback-request.types';
import {
  type FeedPageRequest,
  type FeedPosition,
  newestFirst,
} from '../types/kudos.types';
import {
  type PersonalFeedbackView,
  type PersonalItemsPage,
  type PersonalItemView,
  positionOf,
  type ReceivedItemView,
  type SentRequestItemView,
} from '../types/personal-item.types';
import { PeopleService } from './people.service';

export interface PersonalItemsRead {
  readonly workspaceId: string;
  /** Where the last page ended, or `null` for the first page. */
  readonly after: FeedPosition | null;
  readonly limit: number;
  /** One page of this list's Feedback, past a place in it, or nothing when it holds none. */
  readonly feedback?: (
    page: FeedPageRequest,
  ) => Promise<ReceivedFeedbackPageRow>;
  /** One page of this list's Kudos, past the same place. */
  readonly kudos?: (page: FeedPageRequest) => Promise<KudosPageRow>;
  /** One page of the requests this list's Member sent, past the same place. */
  readonly requests?: (
    page: FeedPageRequest,
  ) => Promise<SentRequestItemPageRow>;
}

const NONE = { items: [], hasMore: false } as const;

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

function toSentRequestView(
  row: SentRequestItemRow,
  people: People,
): SentRequestItemView {
  return {
    kind: 'REQUEST',
    id: row.id,
    message: row.message,
    tags: row.tags,
    visibility: row.visibility,
    requester: people.personOf(row.requesterAccountId),
    selectedPeople: row.selectedAccountIds.map(people.personOf),
    postcard: row.postcard,
    createdAt: row.createdAt,
    latestActivityAt: row.latestActivityAt,
    asked: row.asks.map((ask) => ({
      person: people.personOf(ask.giverAccountId),
      status: AskStatus.of(ask.status).toString(),
      answer: ask.answer,
    })),
  };
}

/** Newest first by where each item sits, which for a request is its latest activity. */
function byPosition(a: ReceivedItemView, b: ReceivedItemView) {
  return newestFirst(positionOf(a), positionOf(b));
}

/**
 * One Member's own list, Received or Given: Feedback, Kudos and, in Received, the requests the Member
 * sent, in one order, newest first, each with the card it was written on, under one cursor (ADR
 * 0077, ADR 0080, ADR 0081, ADR 0082). Which rows are in it is the caller's to read, so this holds
 * nothing about whose list it is.
 */
@Injectable()
export class PersonalItemsService {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly kudosQuery: KudosQuery,
    private readonly peopleService: PeopleService,
  ) {}

  /** A page of a list that holds no requests, which is every list but Received. */
  read(
    input: Omit<PersonalItemsRead, 'requests'>,
  ): Promise<PersonalItemsPage<PersonalItemView>>;
  read(input: PersonalItemsRead): Promise<PersonalItemsPage<ReceivedItemView>>;
  async read(
    input: PersonalItemsRead,
  ): Promise<PersonalItemsPage<ReceivedItemView>> {
    const page: FeedPageRequest = { after: input.after, limit: input.limit };
    const [feedback, kudos, requests] = await Promise.all([
      input.feedback?.(page) ?? NONE,
      input.kudos?.(page) ?? NONE,
      input.requests?.(page) ?? NONE,
    ]);
    const people = await this.peopleService.peopleIn(input.workspaceId, [
      ...feedback.items.flatMap(everyoneIn),
      ...kudos.items.flatMap((each) => [
        each.giverAccountId,
        ...each.recipientAccountIds,
      ]),
      ...requests.items.flatMap((each) => [
        each.requesterAccountId,
        ...each.selectedAccountIds,
        ...each.asks.map((ask) => ask.giverAccountId),
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
    const requestViews = requests.items.map((row) =>
      toSentRequestView(row, people),
    );

    // Each read holds a page, so this holds one more than a page whenever more remain of any.
    const merged = [...feedbackViews, ...kudosViews, ...requestViews].sort(
      byPosition,
    );
    const items = merged.slice(0, input.limit);
    const last = items.at(-1);
    const hasMore =
      merged.length > items.length ||
      feedback.hasMore ||
      kudos.hasMore ||
      requests.hasMore;
    return {
      items,
      next: hasMore && last ? positionOf(last) : null,
    };
  }

  /**
   * Where the row a cursor names sits, which can be in either table, for a list whose cursor is an
   * id (ADR 0077). `null` is the first page, and `undefined` a cursor naming a row that is gone,
   * which ends the list (ADR 0059). Received carries the position itself instead, because a request
   * moves (ADR 0082).
   */
  async positionAfter(
    workspaceId: string,
    afterId: string | null,
  ): Promise<FeedPosition | null | undefined> {
    if (afterId === null) {
      return null;
    }
    const [feedback, kudos] = await Promise.all([
      this.feedbackRequestQuery.feedbackPositionOf(workspaceId, afterId),
      this.kudosQuery.positionOf(workspaceId, afterId),
    ]);
    return feedback ?? kudos ?? undefined;
  }
}
