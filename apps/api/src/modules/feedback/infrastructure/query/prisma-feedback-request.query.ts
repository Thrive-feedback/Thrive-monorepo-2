import { Prisma } from '@app/infrastructure/database/generated/client';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  type FeedbackAskPageRow,
  type FeedbackAskRow,
  type FeedbackAskWithVisibilityRow,
  FeedbackRequestQuery,
  type FeedbackWithPeopleRow,
  type FeedbackWithVisibilityRow,
  type FeedItemPageRow,
  type GivenFeedbackPageRow,
  type GivenFeedbackRow,
  type OpenedRequestRow,
  type PendingAskPageRow,
  type ProfileFeedbackCountsRow,
  type ReceivedFeedbackPageRow,
  type ReceivedFeedbackRow,
  type SentRequestItemPageRow,
  type WaitingAskPageRow,
} from '../../application/query-port/feedback-request.query-port';
import type { FeedbackGivenAt } from '../../application/types/feed-items.types';
import type {
  FeedItemShow,
  PageRequest,
  TagsView,
  WaitingAskSort,
} from '../../application/types/feedback-request.types';
import type {
  CursorPageRequest,
  FeedPageRequest,
  FeedPosition,
} from '../../application/types/kudos.types';
import type { AskStatusValue } from '../../domain/value-object/ask-status.vo';
import type { InstantRange } from '../../domain/value-object/calendar-clock.vo';
import { notBefore, olderThan } from '../mapper/feed-position.mapper';
import {
  toAnswerPostcardSnapshot,
  toFeedbackPostcardSnapshot,
  toPostcardSnapshot,
} from '../mapper/postcard.mapper';

/** Oldest first inside one request: the order the Members were asked in. */
const ASKS_IN_ORDER_ASKED = [{ createdAt: 'asc' }, { id: 'asc' }] satisfies {
  readonly [key: string]: 'asc';
}[];

/** Newest first across requests: what a person sent or was asked most recently comes up. */
const NEWEST_FIRST = [{ createdAt: 'desc' }, { id: 'desc' }] satisfies {
  readonly [key: string]: 'desc';
}[];

const OLDEST_FIRST = [{ createdAt: 'asc' }, { id: 'asc' }] satisfies {
  readonly [key: string]: 'asc';
}[];

/** What some sent text was bound to, in a fixed order so it reads the same on every open. */
const TAGS_FIELDS = {
  workspaceGoals: { orderBy: { name: 'asc' }, select: { name: true } },
  mentions: {
    orderBy: { slug: 'asc' },
    select: { slug: true, displayName: true },
  },
} as const;

/** Receivers in the order the Giver chose them, so a piece names them the same on every open. */
const RECEIVERS_IN_ORDER = {
  orderBy: { position: 'asc' },
  select: { accountId: true },
} as const;

/** Selected people in a fixed order, so a request reads the same on every open. */
const SELECTED_PEOPLE_IN_ORDER = {
  orderBy: { accountId: 'asc' },
  select: { accountId: true },
} as const;

const REQUEST_OF_ASK = {
  select: { id: true, message: true, requesterAccountId: true, ...TAGS_FIELDS },
} as const;

const FEEDBACK_WITH_PEOPLE_FIELDS = {
  id: true,
  origin: true,
  feedbackRequestId: true,
  giverAccountId: true,
  receivers: RECEIVERS_IN_ORDER,
  message: true,
  createdAt: true,
  ...TAGS_FIELDS,
} as const;

/**
 * A piece on Home with its Visibility and, through the Ask it answers, the question, every Ask and
 * every answer. Nested for the reason the feed's is. The other answers need no Visibility of their
 * own here: each took the request's, and Only me never reaches Home, so whoever reads this one on
 * Home may read them (brain `ADR-0050`). Received reads the same, and a Requester reads every
 * answer to their own request, so there the other answers need no check either. The look of the
 * piece and of its request come with it, so each is drawn on the card it was written on.
 */
const FEED_ITEM_FIELDS = {
  ...FEEDBACK_WITH_PEOPLE_FIELDS,
  visibility: true,
  postcard: true,
  feedbackAsk: {
    select: {
      feedbackRequest: {
        select: {
          message: true,
          postcard: true,
          requesterAccountId: true,
          asks: {
            orderBy: ASKS_IN_ORDER_ASKED,
            select: {
              giverAccountId: true,
              status: true,
              feedback: {
                select: { message: true, createdAt: true, ...TAGS_FIELDS },
              },
            },
          },
          ...TAGS_FIELDS,
        },
      },
    },
  },
} as const;

type FeedItemRecord = Prisma.FeedbackGetPayload<{
  select: typeof FEED_ITEM_FIELDS;
}>;

/**
 * A piece a Member wrote: what they would read had they received it, and who may read each answer
 * beside theirs, which differs by reader here as it never does on Home or in Received.
 */
const GIVEN_ITEM_FIELDS = {
  ...FEED_ITEM_FIELDS,
  feedbackAsk: {
    select: {
      feedbackRequest: {
        select: {
          ...FEED_ITEM_FIELDS.feedbackAsk.select.feedbackRequest.select,
          asks: {
            orderBy: ASKS_IN_ORDER_ASKED,
            select: {
              giverAccountId: true,
              status: true,
              feedback: {
                select: {
                  message: true,
                  createdAt: true,
                  visibility: true,
                  selectedPeople: SELECTED_PEOPLE_IN_ORDER,
                  ...TAGS_FIELDS,
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

type GivenItemRecord = Prisma.FeedbackGetPayload<{
  select: typeof GIVEN_ITEM_FIELDS;
}>;

/**
 * A request in its Requester's Received, with every Ask and what each sent back. The Requester reads
 * every answer to what they asked, so no answer needs its Visibility here.
 */
const SENT_REQUEST_ITEM_FIELDS = {
  id: true,
  requesterAccountId: true,
  message: true,
  postcard: true,
  visibility: true,
  createdAt: true,
  selectedPeople: SELECTED_PEOPLE_IN_ORDER,
  ...TAGS_FIELDS,
  asks: {
    orderBy: ASKS_IN_ORDER_ASKED,
    select: {
      giverAccountId: true,
      status: true,
      feedback: {
        select: {
          id: true,
          message: true,
          postcard: true,
          createdAt: true,
          ...TAGS_FIELDS,
        },
      },
    },
  },
} as const;

/** Where one request sits in its Requester's Received, as the read of positions answers it. */
interface SentRequestPositionRecord {
  readonly id: string;
  readonly latestActivityAt: Date;
}

/** A request's card and, through its Asks, every answer, each with its own Visibility. */
const OPENED_REQUEST_FIELDS = {
  message: true,
  requesterAccountId: true,
  postcard: true,
  ...TAGS_FIELDS,
  asks: {
    orderBy: ASKS_IN_ORDER_ASKED,
    select: {
      giverAccountId: true,
      feedback: {
        select: {
          id: true,
          message: true,
          postcard: true,
          createdAt: true,
          visibility: true,
          selectedPeople: SELECTED_PEOPLE_IN_ORDER,
          ...TAGS_FIELDS,
        },
      },
    },
  },
} as const;

function skipFor(page: PageRequest): number {
  return (page.page - 1) * page.pageSize;
}

/** What each choice on Home lets a reader see, always inside one Workspace. */
/** Feedback the whole Workspace reads. */
const EVERYONE_READS = { visibility: 'EVERYONE' } as const;

/**
 * Feedback somebody selected the reader to read. The join alone would answer this — a selected
 * person exists only for SELECTED_PEOPLE, which the Visibility itself holds — and the value is
 * matched anyway, so a row left behind by any other choice is unreadable rather than shared.
 */
function selectedToRead(readerAccountId: string) {
  return {
    visibility: 'SELECTED_PEOPLE',
    selectedPeople: { some: { accountId: readerAccountId } },
  } as const;
}

/**
 * The Feedback given to one Member, asked for or not, that one Visibility filter lets through: the
 * filter a Profile's list and its count both read. Through the Receivers, not
 * `feedback.receiverAccountId`: that column holds only the first of several, and is kept for an
 * older API mid-deploy (ADR 0061).
 */
function feedbackToWhere(
  workspaceId: string,
  receiverAccountId: string,
  readable: typeof EVERYONE_READS | ReturnType<typeof selectedToRead>,
): Prisma.FeedbackWhereInput {
  return {
    workspaceId,
    ...readable,
    receivers: { some: { accountId: receiverAccountId } },
  };
}

/**
 * The Feedback between a reader and one Member, at every Visibility: written by one of them with the
 * other among its Receivers, or one of `writtenToBoth` (ADR 0097). A list and its count read this.
 */
function feedbackBetweenWhere(
  workspaceId: string,
  readerAccountId: string,
  memberAccountId: string,
  writtenToBoth: readonly string[],
): Prisma.FeedbackWhereInput {
  return {
    workspaceId,
    OR: [
      {
        giverAccountId: readerAccountId,
        receivers: { some: { accountId: memberAccountId } },
      },
      {
        giverAccountId: memberAccountId,
        receivers: { some: { accountId: readerAccountId } },
      },
      { id: { in: [...writtenToBoth] } },
    ],
  };
}

/** The Asks still open between a reader and one Member, either way. A list and its count read this. */
function pendingAsksBetweenWhere(
  workspaceId: string,
  readerAccountId: string,
  memberAccountId: string,
): Prisma.FeedbackAskWhereInput {
  return {
    status: 'PENDING',
    OR: [
      {
        giverAccountId: memberAccountId,
        feedbackRequest: { workspaceId, requesterAccountId: readerAccountId },
      },
      {
        giverAccountId: readerAccountId,
        feedbackRequest: { workspaceId, requesterAccountId: memberAccountId },
      },
    ],
  };
}

function feedItemsWhere(
  workspaceId: string,
  readerAccountId: string,
  show: FeedItemShow,
) {
  const everyone = EVERYONE_READS;
  const selected = selectedToRead(readerAccountId);
  switch (show) {
    case 'EVERYONE':
      return { workspaceId, ...everyone };
    case 'SHARED_WITH_ME':
      return { workspaceId, ...selected };
    case 'ALL':
      return { workspaceId, OR: [everyone, selected] };
  }
}

/** Reads through `client`, so a read inside a unit of work joins its transaction. */
@Injectable()
export class PrismaFeedbackRequestQuery extends FeedbackRequestQuery {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async asksFor(
    workspaceId: string,
    giverAccountId: string,
    status: AskStatusValue,
    page: PageRequest,
  ): Promise<FeedbackAskPageRow> {
    const where = {
      giverAccountId,
      status,
      feedbackRequest: { workspaceId },
    };
    const client = this.prismaTransactionContext.client;
    const [records, total] = await Promise.all([
      client.feedbackAsk.findMany({
        where,
        orderBy: NEWEST_FIRST,
        skip: skipFor(page),
        take: page.pageSize,
        select: {
          id: true,
          status: true,
          createdAt: true,
          feedbackRequest: REQUEST_OF_ASK,
        },
      }),
      client.feedbackAsk.count({ where }),
    ]);
    return { items: records.map(toFeedbackAskRow), total };
  }

  async waitingAsksFor(
    workspaceId: string,
    giverAccountId: string,
    sort: WaitingAskSort,
    page: CursorPageRequest,
  ): Promise<WaitingAskPageRow> {
    // One row more than asked for tells whether another page follows (ADR 0059). One more again is
    // for the Ask the cursor names, which is only in the read while it is still waiting. Answered,
    // it has left, so a `skip: 1` would pass over the next Ask instead of it (ADR 0075).
    const records =
      await this.prismaTransactionContext.client.feedbackAsk.findMany({
        where: {
          giverAccountId,
          status: 'PENDING',
          feedbackRequest: { workspaceId },
        },
        orderBy: sort === 'OLDEST' ? OLDEST_FIRST : NEWEST_FIRST,
        take: page.limit + 2,
        ...(page.afterId === null ? {} : { cursor: { id: page.afterId } }),
        select: {
          id: true,
          status: true,
          createdAt: true,
          feedbackRequest: {
            select: { ...REQUEST_OF_ASK.select, postcard: true },
          },
        },
      });
    const after = records.filter((record) => record.id !== page.afterId);
    return {
      items: after.slice(0, page.limit).map((record) => ({
        ...toFeedbackAskRow(record),
        postcard: toPostcardSnapshot(record.feedbackRequest.postcard),
      })),
      hasMore: after.length > page.limit,
    };
  }

  async feedItemsFor(
    workspaceId: string,
    readerAccountId: string,
    show: FeedItemShow,
    page: FeedPageRequest,
  ): Promise<FeedItemPageRow> {
    // One row more than asked for, only to tell whether another page follows (ADR 0059).
    const records =
      await this.prismaTransactionContext.client.feedback.findMany({
        where: {
          AND: [
            feedItemsWhere(workspaceId, readerAccountId, show),
            olderThan(page.after),
          ],
        },
        orderBy: NEWEST_FIRST,
        take: page.limit + 1,
        select: FEED_ITEM_FIELDS,
      });
    return {
      items: records.slice(0, page.limit).map((record) => ({
        ...toReceivedFeedbackRow(record),
        // Everything `feedItemsWhere` lets through is one of these two.
        visibility:
          record.visibility === 'EVERYONE' ? 'EVERYONE' : 'SELECTED_PEOPLE',
      })),
      hasMore: records.length > page.limit,
    };
  }

  async feedItemsGivenIn(
    workspaceId: string,
    readerAccountId: string,
    show: FeedItemShow,
    within: InstantRange,
  ): Promise<readonly FeedbackGivenAt[]> {
    // A range on the stored instant rather than a day worked out in SQL, so an index serves it; the
    // days are counted above this, on the one clock (ADR 0095).
    return this.prismaTransactionContext.client.feedback.findMany({
      where: {
        AND: [
          feedItemsWhere(workspaceId, readerAccountId, show),
          { createdAt: { gte: within.from, lt: within.until } },
        ],
      },
      select: { origin: true, createdAt: true },
    });
  }

  async offeredItemsTo(
    workspaceId: string,
    receiverAccountId: string,
    page: FeedPageRequest,
  ): Promise<ReceivedFeedbackPageRow> {
    // One row more than asked for, only to tell whether another page follows (ADR 0059).
    const records =
      await this.prismaTransactionContext.client.feedback.findMany({
        where: {
          AND: [
            // Through the Receivers, not `feedback.receiverAccountId`: that column holds only the
            // first of several, and is kept for an older API mid-deploy (ADR 0061).
            {
              workspaceId,
              origin: 'OFFERED' as const,
              receivers: { some: { accountId: receiverAccountId } },
            },
            olderThan(page.after),
          ],
        },
        orderBy: NEWEST_FIRST,
        take: page.limit + 1,
        select: FEED_ITEM_FIELDS,
      });
    return {
      items: records.slice(0, page.limit).map(toReceivedFeedbackRow),
      hasMore: records.length > page.limit,
    };
  }

  everyoneFeedbackTo(
    workspaceId: string,
    receiverAccountId: string,
    page: FeedPageRequest,
    since: Date | null,
  ): Promise<ReceivedFeedbackPageRow> {
    return this.feedbackToReadable(
      feedbackToWhere(workspaceId, receiverAccountId, EVERYONE_READS),
      page,
      since,
    );
  }

  sharedFeedbackTo(
    workspaceId: string,
    receiverAccountId: string,
    readerAccountId: string,
    page: FeedPageRequest,
    since: Date | null,
  ): Promise<ReceivedFeedbackPageRow> {
    return this.feedbackToReadable(
      feedbackToWhere(
        workspaceId,
        receiverAccountId,
        selectedToRead(readerAccountId),
      ),
      page,
      since,
    );
  }

  /** One page of the Feedback given to one Member that one `feedbackToWhere` lets through. */
  private async feedbackToReadable(
    readable: Prisma.FeedbackWhereInput,
    page: FeedPageRequest,
    since: Date | null,
  ): Promise<ReceivedFeedbackPageRow> {
    // One row more than asked for, only to tell whether another page follows (ADR 0059).
    const records =
      await this.prismaTransactionContext.client.feedback.findMany({
        where: { AND: [readable, notBefore(since), olderThan(page.after)] },
        orderBy: NEWEST_FIRST,
        take: page.limit + 1,
        select: FEED_ITEM_FIELDS,
      });
    return {
      items: records.slice(0, page.limit).map(toReceivedFeedbackRow),
      hasMore: records.length > page.limit,
    };
  }

  async sentRequestItemsBy(
    workspaceId: string,
    requesterAccountId: string,
    page: FeedPageRequest,
  ): Promise<SentRequestItemPageRow> {
    const { client } = this.prismaTransactionContext;
    // A request's place is computed from its answers, which Prisma cannot order by, so the places
    // are read in SQL and the requests themselves by id, two queries however long the page. Every
    // answer carries its request's id, so the newest of them is the request's latest activity.
    const past =
      page.after === null
        ? Prisma.empty
        : Prisma.sql`HAVING (COALESCE(MAX(f."createdAt"), r."createdAt"), r."id") < (${page.after.createdAt}::timestamp(3), ${page.after.id})`;
    // One row more than asked for, only to tell whether another page follows (ADR 0059).
    const positions = await client.$queryRaw<SentRequestPositionRecord[]>`
      SELECT r."id", COALESCE(MAX(f."createdAt"), r."createdAt") AS "latestActivityAt"
      FROM "feedback_request" r
      LEFT JOIN "feedback" f ON f."feedbackRequestId" = r."id"
      WHERE r."workspaceId" = ${workspaceId}
        AND r."requesterAccountId" = ${requesterAccountId}
      GROUP BY r."id"
      ${past}
      ORDER BY 2 DESC, r."id" DESC
      LIMIT ${page.limit + 1}
    `;
    const shown = positions.slice(0, page.limit);
    const records = await client.feedbackRequest.findMany({
      where: { workspaceId, id: { in: shown.map(({ id }) => id) } },
      select: SENT_REQUEST_ITEM_FIELDS,
    });
    const byId = new Map(records.map((record) => [record.id, record]));
    return {
      items: shown.flatMap(({ id, latestActivityAt }) => {
        const record = byId.get(id);
        if (!record) {
          return [];
        }
        return [
          {
            id: record.id,
            requesterAccountId: record.requesterAccountId,
            message: record.message,
            tags: tagsOf(record),
            visibility: record.visibility,
            selectedAccountIds: accountIdsOf(record.selectedPeople),
            postcard: toPostcardSnapshot(record.postcard),
            createdAt: record.createdAt,
            latestActivityAt,
            asks: record.asks.map((ask) => ({
              giverAccountId: ask.giverAccountId,
              status: ask.status,
              answer: ask.feedback && {
                id: ask.feedback.id,
                message: ask.feedback.message,
                tags: tagsOf(ask.feedback),
                postcard: toAnswerPostcardSnapshot(ask.feedback.postcard),
                answeredAt: ask.feedback.createdAt,
              },
            })),
          },
        ];
      }),
      hasMore: positions.length > page.limit,
    };
  }

  async givenItemsBy(
    workspaceId: string,
    giverAccountId: string,
    page: FeedPageRequest,
  ): Promise<GivenFeedbackPageRow> {
    // One row more than asked for, only to tell whether another page follows (ADR 0059).
    const records =
      await this.prismaTransactionContext.client.feedback.findMany({
        where: {
          AND: [{ workspaceId, giverAccountId }, olderThan(page.after)],
        },
        orderBy: NEWEST_FIRST,
        take: page.limit + 1,
        select: GIVEN_ITEM_FIELDS,
      });
    return {
      items: records.slice(0, page.limit).map(toGivenFeedbackRow),
      hasMore: records.length > page.limit,
    };
  }

  async feedbackBetween(
    workspaceId: string,
    readerAccountId: string,
    memberAccountId: string,
    page: FeedPageRequest,
    since: Date | null,
  ): Promise<GivenFeedbackPageRow> {
    const between = feedbackBetweenWhere(
      workspaceId,
      readerAccountId,
      memberAccountId,
      await this.feedbackWrittenToBoth(readerAccountId, memberAccountId),
    );
    // One row more than asked for, only to tell whether another page follows (ADR 0059).
    const records =
      await this.prismaTransactionContext.client.feedback.findMany({
        where: { AND: [between, notBefore(since), olderThan(page.after)] },
        orderBy: NEWEST_FIRST,
        take: page.limit + 1,
        select: GIVEN_ITEM_FIELDS,
      });
    return {
      items: records.slice(0, page.limit).map(toGivenFeedbackRow),
      hasMore: records.length > page.limit,
    };
  }

  async profileCounts(
    workspaceId: string,
    readerAccountId: string | null,
    memberAccountId: string,
    since: Date | null,
  ): Promise<ProfileFeedbackCountsRow> {
    const { client } = this.prismaTransactionContext;
    const from = notBefore(since);
    const countFeedback = (where: Prisma.FeedbackWhereInput) =>
      client.feedback.count({ where: { AND: [where, from] } });
    const everyoneFeedback = countFeedback(
      feedbackToWhere(workspaceId, memberAccountId, EVERYONE_READS),
    );
    if (readerAccountId === null) {
      return {
        everyoneFeedback: await everyoneFeedback,
        sharedFeedback: 0,
        feedbackBetween: 0,
        openAsks: 0,
      };
    }
    const writtenToBoth = await this.feedbackWrittenToBoth(
      readerAccountId,
      memberAccountId,
    );
    const [everyone, sharedFeedback, feedbackBetween, openAsks] =
      await Promise.all([
        everyoneFeedback,
        countFeedback(
          feedbackToWhere(
            workspaceId,
            memberAccountId,
            selectedToRead(readerAccountId),
          ),
        ),
        countFeedback(
          feedbackBetweenWhere(
            workspaceId,
            readerAccountId,
            memberAccountId,
            writtenToBoth,
          ),
        ),
        client.feedbackAsk.count({
          where: pendingAsksBetweenWhere(
            workspaceId,
            readerAccountId,
            memberAccountId,
          ),
        }),
      ]);
    return {
      everyoneFeedback: everyone,
      sharedFeedback,
      feedbackBetween,
      openAsks,
    };
  }

  /**
   * The Feedback with both people among its Receivers, in any Workspace. Read on its own because
   * this branch of "between" has no Giver to look up by: asked inside the page read, it made Postgres
   * read every piece in the Workspace and filter it, so a page cost what the Workspace's history held
   * (ADR 0097). Read first through the Receivers' own index, its ids make every branch an index scan.
   * An Account can be in another Workspace, so these are only candidates: the page read keeps this
   * Workspace's.
   */
  private async feedbackWrittenToBoth(
    readerAccountId: string,
    memberAccountId: string,
  ): Promise<readonly string[]> {
    const rows =
      await this.prismaTransactionContext.client.feedbackReceiver.groupBy({
        by: ['feedbackId'],
        where: { accountId: { in: [readerAccountId, memberAccountId] } },
        having: { accountId: { _count: { equals: 2 } } },
      });
    return rows.map((row) => row.feedbackId);
  }

  async pendingAsksBetween(
    workspaceId: string,
    readerAccountId: string,
    memberAccountId: string,
    page: FeedPageRequest,
  ): Promise<PendingAskPageRow> {
    // One row more than asked for, only to tell whether another page follows (ADR 0059).
    const records =
      await this.prismaTransactionContext.client.feedbackAsk.findMany({
        where: {
          AND: [
            pendingAsksBetweenWhere(
              workspaceId,
              readerAccountId,
              memberAccountId,
            ),
            olderThan(page.after),
          ],
        },
        orderBy: NEWEST_FIRST,
        take: page.limit + 1,
        select: {
          id: true,
          giverAccountId: true,
          createdAt: true,
          feedbackRequest: {
            select: { ...REQUEST_OF_ASK.select, postcard: true },
          },
        },
      });
    return {
      items: records.slice(0, page.limit).map((record) => ({
        id: record.id,
        feedbackRequestId: record.feedbackRequest.id,
        requesterAccountId: record.feedbackRequest.requesterAccountId,
        giverAccountId: record.giverAccountId,
        message: record.feedbackRequest.message,
        tags: tagsOf(record.feedbackRequest),
        postcard: toPostcardSnapshot(record.feedbackRequest.postcard),
        createdAt: record.createdAt,
      })),
      hasMore: records.length > page.limit,
    };
  }

  async askPositionOf(
    workspaceId: string,
    askId: string,
  ): Promise<FeedPosition | null> {
    return this.prismaTransactionContext.client.feedbackAsk.findFirst({
      where: { id: askId, feedbackRequest: { workspaceId } },
      select: { id: true, createdAt: true },
    });
  }

  async feedbackPositionOf(
    workspaceId: string,
    feedbackId: string,
  ): Promise<FeedPosition | null> {
    return this.prismaTransactionContext.client.feedback.findFirst({
      where: { id: feedbackId, workspaceId },
      select: { id: true, createdAt: true },
    });
  }

  async feedbackInWorkspace(
    workspaceId: string,
    feedbackId: string,
  ): Promise<FeedbackWithVisibilityRow | null> {
    const record =
      await this.prismaTransactionContext.client.feedback.findFirst({
        where: { id: feedbackId, workspaceId },
        // Every piece holds its own Visibility, so Offered Feedback — which has no request to
        // read it from — is opened the same way as an answer.
        select: {
          id: true,
          origin: true,
          feedbackRequestId: true,
          giverAccountId: true,
          receivers: RECEIVERS_IN_ORDER,
          message: true,
          postcard: true,
          createdAt: true,
          visibility: true,
          selectedPeople: SELECTED_PEOPLE_IN_ORDER,
          ...TAGS_FIELDS,
        },
      });
    if (!record) {
      return null;
    }
    return {
      id: record.id,
      origin: record.origin,
      feedbackRequestId: record.feedbackRequestId,
      giverAccountId: record.giverAccountId,
      receiverAccountIds: accountIdsOf(record.receivers),
      message: record.message,
      postcard: toFeedbackPostcardSnapshot(record.origin, record.postcard),
      tags: tagsOf(record),
      createdAt: record.createdAt,
      visibility: record.visibility,
      selectedAccountIds: record.selectedPeople.map(
        (person) => person.accountId,
      ),
    };
  }

  async openedRequest(
    workspaceId: string,
    requestId: string,
  ): Promise<OpenedRequestRow | null> {
    const record =
      await this.prismaTransactionContext.client.feedbackRequest.findFirst({
        where: { id: requestId, workspaceId },
        select: OPENED_REQUEST_FIELDS,
      });
    if (!record) {
      return null;
    }
    return {
      message: record.message,
      tags: tagsOf(record),
      requesterAccountId: record.requesterAccountId,
      postcard: toPostcardSnapshot(record.postcard),
      answers: record.asks.flatMap(({ giverAccountId, feedback }) =>
        feedback
          ? [
              {
                id: feedback.id,
                giverAccountId,
                message: feedback.message,
                tags: tagsOf(feedback),
                postcard: toAnswerPostcardSnapshot(feedback.postcard),
                answeredAt: feedback.createdAt,
                visibility: feedback.visibility,
                selectedAccountIds: feedback.selectedPeople.map(
                  (person) => person.accountId,
                ),
              },
            ]
          : [],
      ),
    };
  }

  async askFor(
    workspaceId: string,
    giverAccountId: string,
    askId: string,
  ): Promise<FeedbackAskWithVisibilityRow | null> {
    const record =
      await this.prismaTransactionContext.client.feedbackAsk.findFirst({
        where: {
          id: askId,
          giverAccountId,
          feedbackRequest: { workspaceId },
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          feedbackRequest: {
            select: {
              ...REQUEST_OF_ASK.select,
              visibility: true,
              postcard: true,
            },
          },
        },
      });
    return record
      ? {
          ...toFeedbackAskRow(record),
          visibility: record.feedbackRequest.visibility,
          postcard: toPostcardSnapshot(record.feedbackRequest.postcard),
        }
      : null;
  }
}

function toFeedbackAskRow(record: {
  readonly id: string;
  readonly status: string;
  readonly createdAt: Date;
  readonly feedbackRequest: StoredTags & {
    readonly id: string;
    readonly message: string;
    readonly requesterAccountId: string;
  };
}): FeedbackAskRow {
  return {
    askId: record.id,
    feedbackRequestId: record.feedbackRequest.id,
    message: record.feedbackRequest.message,
    tags: tagsOf(record.feedbackRequest),
    requesterAccountId: record.feedbackRequest.requesterAccountId,
    status: record.status,
    createdAt: record.createdAt,
  };
}

/** What some sent text was bound to, as the rows beside it hold it. */
interface StoredTags {
  readonly workspaceGoals: readonly { readonly name: string }[];
  readonly mentions: readonly {
    readonly slug: string;
    readonly displayName: string;
  }[];
}

function accountIdsOf(
  people: readonly { readonly accountId: string }[],
): readonly string[] {
  return people.map((person) => person.accountId);
}

function tagsOf(record: StoredTags): TagsView {
  return {
    workspaceGoals: record.workspaceGoals.map((workspaceGoal) => ({
      name: workspaceGoal.name,
    })),
    mentions: record.mentions.map((mention) => ({
      slug: mention.slug,
      displayName: mention.displayName,
    })),
  };
}

/** A piece as its Giver reads it, with who may read each answer beside theirs. */
function toGivenFeedbackRow(record: GivenItemRecord): GivenFeedbackRow {
  const received = toReceivedFeedbackRow(record);
  const asks = record.feedbackAsk?.feedbackRequest.asks ?? [];
  return {
    ...received,
    request: received.request && {
      ...received.request,
      asks: received.request.asks.map((ask, place) => {
        const answer = asks[place]?.feedback;
        return {
          ...ask,
          answerAudience: answer
            ? {
                visibility: answer.visibility,
                selectedAccountIds: accountIdsOf(answer.selectedPeople),
              }
            : null,
        };
      }),
    },
  };
}

function toReceivedFeedbackRow(record: FeedItemRecord): ReceivedFeedbackRow {
  const request = record.feedbackAsk?.feedbackRequest;
  return {
    ...toFeedbackWithPeopleRow(record),
    visibility: record.visibility,
    postcard: toFeedbackPostcardSnapshot(record.origin, record.postcard),
    request: request
      ? {
          message: request.message,
          tags: tagsOf(request),
          requesterAccountId: request.requesterAccountId,
          asks: request.asks.map((ask) => ({
            giverAccountId: ask.giverAccountId,
            status: ask.status,
            answer: ask.feedback && {
              message: ask.feedback.message,
              tags: tagsOf(ask.feedback),
              answeredAt: ask.feedback.createdAt,
            },
          })),
          postcard: toPostcardSnapshot(request.postcard),
          answerPostcard: toAnswerPostcardSnapshot(record.postcard),
        }
      : null,
  };
}

function toFeedbackWithPeopleRow(
  record: StoredTags & {
    readonly id: string;
    readonly origin: FeedbackWithPeopleRow['origin'];
    readonly feedbackRequestId: string | null;
    readonly giverAccountId: string;
    readonly receivers: readonly { readonly accountId: string }[];
    readonly message: string;
    readonly createdAt: Date;
  },
): FeedbackWithPeopleRow {
  return {
    id: record.id,
    origin: record.origin,
    feedbackRequestId: record.feedbackRequestId,
    giverAccountId: record.giverAccountId,
    receiverAccountIds: accountIdsOf(record.receivers),
    message: record.message,
    tags: tagsOf(record),
    createdAt: record.createdAt,
  };
}
