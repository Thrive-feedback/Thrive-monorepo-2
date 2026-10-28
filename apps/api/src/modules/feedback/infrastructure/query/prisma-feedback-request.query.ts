import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  type AnsweredRequestRow,
  type FeedbackAnswerRow,
  type FeedbackAskPageRow,
  type FeedbackAskWithVisibilityRow,
  type FeedbackPageRow,
  type FeedbackRequestPageRow,
  FeedbackRequestQuery,
  type FeedbackRequestRow,
  type FeedbackWithPeopleRow,
  type FeedbackWithRequestPageRow,
  type FeedbackWithRequestRow,
  type FeedbackWithVisibilityRow,
  type SentFeedbackRequestRow,
} from '../../application/query-port/feedback-request.query-port';
import type {
  PageRequest,
  TagsView,
} from '../../application/types/feedback-request.types';
import type { AskStatusValue } from '../../domain/value-object/ask-status.vo';

/** Oldest first inside one request: the order the Members were asked in. */
const ASKS_IN_ORDER_ASKED = [{ createdAt: 'asc' }, { id: 'asc' }] satisfies {
  readonly [key: string]: 'asc';
}[];

/** Newest first across requests: what a person sent or was asked most recently comes up. */
const NEWEST_FIRST = [{ createdAt: 'desc' }, { id: 'desc' }] satisfies {
  readonly [key: string]: 'desc';
}[];

/** What some sent text was bound to, in a fixed order so it reads the same on every open. */
const TAGS_FIELDS = {
  workspaceGoals: { orderBy: { name: 'asc' }, select: { name: true } },
  mentions: {
    orderBy: { slug: 'asc' },
    select: { slug: true, displayName: true },
  },
} as const;

const ASK_FIELDS = {
  id: true,
  giverAccountId: true,
  status: true,
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

const REQUEST_FIELDS = {
  id: true,
  requesterAccountId: true,
  message: true,
  visibility: true,
  createdAt: true,
  asks: { orderBy: ASKS_IN_ORDER_ASKED, select: ASK_FIELDS },
  selectedPeople: SELECTED_PEOPLE_IN_ORDER,
  ...TAGS_FIELDS,
} as const;

/**
 * A request as its Requester lists it: every Ask with the answer it collected, nested so a page
 * is read in a fixed number of queries however many answers it holds.
 */
const SENT_REQUEST_FIELDS = {
  ...REQUEST_FIELDS,
  asks: {
    orderBy: ASKS_IN_ORDER_ASKED,
    select: {
      ...ASK_FIELDS,
      feedback: { select: { message: true, createdAt: true, ...TAGS_FIELDS } },
    },
  },
} as const;

/** An Ask's request, with the Visibility that decides whether the answer goes on the feed. */
const REQUEST_OF_ASK = {
  select: {
    id: true,
    message: true,
    requesterAccountId: true,
    visibility: true,
    ...TAGS_FIELDS,
  },
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
 * A piece of Feedback and, through the Ask it answers, its request: the Request message and
 * everyone asked. Nested, so a page is read in a fixed number of queries however many answers it
 * holds.
 */
const FEEDBACK_WITH_REQUEST_FIELDS = {
  ...FEEDBACK_WITH_PEOPLE_FIELDS,
  feedbackAsk: {
    select: {
      feedbackRequest: {
        select: {
          message: true,
          requesterAccountId: true,
          asks: {
            orderBy: ASKS_IN_ORDER_ASKED,
            select: { giverAccountId: true },
          },
          ...TAGS_FIELDS,
        },
      },
    },
  },
} as const;

function skipFor(page: PageRequest): number {
  return (page.page - 1) * page.pageSize;
}

/** Reads through `client`, so a read inside a unit of work joins its transaction. */
@Injectable()
export class PrismaFeedbackRequestQuery extends FeedbackRequestQuery {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async requestInWorkspace(
    workspaceId: string,
    requestId: string,
  ): Promise<FeedbackRequestRow | null> {
    const record =
      await this.prismaTransactionContext.client.feedbackRequest.findFirst({
        where: { id: requestId, workspaceId },
        select: REQUEST_FIELDS,
      });
    return record ? toFeedbackRequestRow(record) : null;
  }

  async answersInRequest(
    workspaceId: string,
    requestId: string,
  ): Promise<readonly FeedbackAnswerRow[]> {
    const records =
      await this.prismaTransactionContext.client.feedback.findMany({
        where: { workspaceId, feedbackRequestId: requestId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: {
          feedbackAskId: true,
          message: true,
          createdAt: true,
          ...TAGS_FIELDS,
        },
      });
    // Feedback that names a request answers one of its Asks, so every row here has an Ask id;
    // the column is nullable only for Feedback given without being asked.
    return records.flatMap((record) =>
      record.feedbackAskId === null
        ? []
        : [
            {
              askId: record.feedbackAskId,
              message: record.message,
              tags: tagsOf(record),
              answeredAt: record.createdAt,
            },
          ],
    );
  }

  async sentInWorkspace(
    workspaceId: string,
    requesterAccountId: string,
    page: PageRequest,
  ): Promise<FeedbackRequestPageRow> {
    const where = { workspaceId, requesterAccountId };
    const client = this.prismaTransactionContext.client;
    const [records, total] = await Promise.all([
      client.feedbackRequest.findMany({
        where,
        orderBy: NEWEST_FIRST,
        skip: skipFor(page),
        take: page.pageSize,
        select: SENT_REQUEST_FIELDS,
      }),
      client.feedbackRequest.count({ where }),
    ]);
    return { items: records.map(toSentFeedbackRequestRow), total };
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
    return { items: records.map(toFeedbackAskWithVisibilityRow), total };
  }

  async receivedBy(
    workspaceId: string,
    receiverAccountId: string,
    page: PageRequest,
  ): Promise<FeedbackPageRow> {
    const where = {
      workspaceId,
      receivers: { some: { accountId: receiverAccountId } },
    };
    const client = this.prismaTransactionContext.client;
    const [records, total] = await Promise.all([
      client.feedback.findMany({
        where,
        orderBy: NEWEST_FIRST,
        skip: skipFor(page),
        take: page.pageSize,
        select: FEEDBACK_WITH_REQUEST_FIELDS,
      }),
      client.feedback.count({ where }),
    ]);
    return { items: records.map(toFeedbackWithRequestRow), total };
  }

  async sharedWith(
    workspaceId: string,
    readerAccountId: string,
    page: PageRequest,
  ): Promise<FeedbackWithRequestPageRow> {
    // The join alone would answer this — a selected person exists only for SELECTED_PEOPLE,
    // which the Visibility itself holds — and the value is matched anyway, so a row left behind
    // by any other choice is unreadable rather than shared.
    const where = {
      workspaceId,
      visibility: 'SELECTED_PEOPLE',
      selectedPeople: { some: { accountId: readerAccountId } },
    } as const;
    const client = this.prismaTransactionContext.client;
    const [records, total] = await Promise.all([
      client.feedback.findMany({
        where,
        orderBy: NEWEST_FIRST,
        skip: skipFor(page),
        take: page.pageSize,
        select: FEEDBACK_WITH_REQUEST_FIELDS,
      }),
      client.feedback.count({ where }),
    ]);
    return { items: records.map(toFeedbackWithRequestRow), total };
  }

  async publicIn(
    workspaceId: string,
    page: PageRequest,
  ): Promise<FeedbackWithRequestPageRow> {
    const where = { workspaceId, visibility: 'EVERYONE' } as const;
    const client = this.prismaTransactionContext.client;
    const [records, total] = await Promise.all([
      client.feedback.findMany({
        where,
        orderBy: NEWEST_FIRST,
        skip: skipFor(page),
        take: page.pageSize,
        select: FEEDBACK_WITH_REQUEST_FIELDS,
      }),
      client.feedback.count({ where }),
    ]);
    return { items: records.map(toFeedbackWithRequestRow), total };
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
      tags: tagsOf(record),
      createdAt: record.createdAt,
      visibility: record.visibility,
      selectedAccountIds: record.selectedPeople.map(
        (person) => person.accountId,
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
          feedbackRequest: REQUEST_OF_ASK,
        },
      });
    return record ? toFeedbackAskWithVisibilityRow(record) : null;
  }
}

function toFeedbackAskWithVisibilityRow(record: {
  readonly id: string;
  readonly status: string;
  readonly createdAt: Date;
  readonly feedbackRequest: StoredTags & {
    readonly id: string;
    readonly message: string;
    readonly requesterAccountId: string;
    readonly visibility: FeedbackAskWithVisibilityRow['visibility'];
  };
}): FeedbackAskWithVisibilityRow {
  return {
    askId: record.id,
    feedbackRequestId: record.feedbackRequest.id,
    message: record.feedbackRequest.message,
    tags: tagsOf(record.feedbackRequest),
    requesterAccountId: record.feedbackRequest.requesterAccountId,
    status: record.status,
    createdAt: record.createdAt,
    visibility: record.feedbackRequest.visibility,
  };
}

function toSentFeedbackRequestRow(
  record: Omit<Parameters<typeof toFeedbackRequestRow>[0], 'asks'> & {
    readonly asks: readonly {
      readonly id: string;
      readonly giverAccountId: string;
      readonly status: string;
      readonly feedback:
        | (StoredTags & { readonly message: string; readonly createdAt: Date })
        | null;
    }[];
  },
): SentFeedbackRequestRow {
  return {
    ...toFeedbackRequestRow(record),
    // Each Ask built from its own record, so its answer can never land on another Ask.
    asks: record.asks.map((ask) => ({
      askId: ask.id,
      giverAccountId: ask.giverAccountId,
      status: ask.status,
      answer: ask.feedback && {
        message: ask.feedback.message,
        tags: tagsOf(ask.feedback),
        answeredAt: ask.feedback.createdAt,
      },
    })),
  };
}

function toFeedbackRequestRow(
  record: StoredTags & {
    readonly id: string;
    readonly requesterAccountId: string;
    readonly message: string;
    readonly visibility: string;
    readonly createdAt: Date;
    readonly asks: readonly {
      readonly id: string;
      readonly giverAccountId: string;
      readonly status: string;
    }[];
    readonly selectedPeople: readonly { readonly accountId: string }[];
  },
): FeedbackRequestRow {
  return {
    id: record.id,
    requesterAccountId: record.requesterAccountId,
    message: record.message,
    tags: tagsOf(record),
    visibility: record.visibility,
    selectedAccountIds: record.selectedPeople.map((person) => person.accountId),
    createdAt: record.createdAt,
    asks: record.asks.map((ask) => ({
      askId: ask.id,
      giverAccountId: ask.giverAccountId,
      status: ask.status,
    })),
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

function toAnsweredRequestRow(
  record: StoredTags & {
    readonly message: string;
    readonly requesterAccountId: string;
    readonly asks: readonly { readonly giverAccountId: string }[];
  },
): AnsweredRequestRow {
  return {
    message: record.message,
    tags: tagsOf(record),
    requesterAccountId: record.requesterAccountId,
    askedAccountIds: record.asks.map((ask) => ask.giverAccountId),
  };
}

function toFeedbackWithRequestRow(
  record: Parameters<typeof toFeedbackWithPeopleRow>[0] & {
    readonly feedbackAsk: {
      readonly feedbackRequest: Parameters<typeof toAnsweredRequestRow>[0];
    } | null;
  },
): FeedbackWithRequestRow {
  return {
    ...toFeedbackWithPeopleRow(record),
    request: record.feedbackAsk
      ? toAnsweredRequestRow(record.feedbackAsk.feedbackRequest)
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
