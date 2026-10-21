import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  type FeedbackAnswerRow,
  type FeedbackAskPageRow,
  type FeedbackAskRow,
  type FeedbackPageRow,
  type FeedbackRequestPageRow,
  FeedbackRequestQuery,
  type FeedbackRequestRow,
  type FeedbackWithPeoplePageRow,
  type FeedbackWithPeopleRow,
  type FeedbackWithVisibilityRow,
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

/**
 * Feedback's own tags, and — when it answers an Ask — the request's, which its Topic is read
 * with: the Topic is the request's, so what it names is too.
 */
const FEEDBACK_TAGS_FIELDS = {
  ...TAGS_FIELDS,
  feedbackAsk: { select: { feedbackRequest: { select: TAGS_FIELDS } } },
} as const;

const ASK_FIELDS = {
  id: true,
  giverAccountId: true,
  status: true,
} as const;

/** Selected people in a fixed order, so a request reads the same on every open. */
const SELECTED_PEOPLE_IN_ORDER = {
  orderBy: { accountId: 'asc' },
  select: { accountId: true },
} as const;

const REQUEST_FIELDS = {
  id: true,
  requesterAccountId: true,
  topic: true,
  visibility: true,
  createdAt: true,
  asks: { orderBy: ASKS_IN_ORDER_ASKED, select: ASK_FIELDS },
  selectedPeople: SELECTED_PEOPLE_IN_ORDER,
  ...TAGS_FIELDS,
} as const;

const REQUEST_OF_ASK = {
  select: { id: true, topic: true, requesterAccountId: true, ...TAGS_FIELDS },
} as const;

const FEEDBACK_WITH_PEOPLE_FIELDS = {
  id: true,
  origin: true,
  feedbackRequestId: true,
  topic: true,
  giverAccountId: true,
  receiverAccountId: true,
  body: true,
  createdAt: true,
  ...FEEDBACK_TAGS_FIELDS,
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
          body: true,
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
              body: record.body,
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
        select: REQUEST_FIELDS,
      }),
      client.feedbackRequest.count({ where }),
    ]);
    return {
      items: records.map(toFeedbackRequestRow),
      total,
    };
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

  async receivedBy(
    workspaceId: string,
    receiverAccountId: string,
    page: PageRequest,
  ): Promise<FeedbackPageRow> {
    const where = { workspaceId, receiverAccountId };
    const client = this.prismaTransactionContext.client;
    const [records, total] = await Promise.all([
      client.feedback.findMany({
        where,
        orderBy: NEWEST_FIRST,
        skip: skipFor(page),
        take: page.pageSize,
        select: {
          id: true,
          origin: true,
          feedbackRequestId: true,
          topic: true,
          giverAccountId: true,
          body: true,
          createdAt: true,
          ...FEEDBACK_TAGS_FIELDS,
        },
      }),
      client.feedback.count({ where }),
    ]);
    return {
      items: records.map((record) => ({
        id: record.id,
        origin: record.origin,
        feedbackRequestId: record.feedbackRequestId,
        topic: record.topic,
        topicTags: topicTagsOf(record),
        giverAccountId: record.giverAccountId,
        body: record.body,
        tags: tagsOf(record),
        createdAt: record.createdAt,
      })),
      total,
    };
  }

  async givenBy(
    workspaceId: string,
    giverAccountId: string,
    page: PageRequest,
  ): Promise<FeedbackWithPeoplePageRow> {
    const where = { workspaceId, giverAccountId };
    const client = this.prismaTransactionContext.client;
    const [records, total] = await Promise.all([
      client.feedback.findMany({
        where,
        orderBy: NEWEST_FIRST,
        skip: skipFor(page),
        take: page.pageSize,
        select: FEEDBACK_WITH_PEOPLE_FIELDS,
      }),
      client.feedback.count({ where }),
    ]);
    return { items: records.map(toFeedbackWithPeopleRow), total };
  }

  async sharedWith(
    workspaceId: string,
    readerAccountId: string,
    page: PageRequest,
  ): Promise<FeedbackWithPeoplePageRow> {
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
        select: FEEDBACK_WITH_PEOPLE_FIELDS,
      }),
      client.feedback.count({ where }),
    ]);
    return { items: records.map(toFeedbackWithPeopleRow), total };
  }

  async publicIn(
    workspaceId: string,
    page: PageRequest,
  ): Promise<FeedbackWithPeoplePageRow> {
    const where = { workspaceId, visibility: 'EVERYONE' } as const;
    const client = this.prismaTransactionContext.client;
    const [records, total] = await Promise.all([
      client.feedback.findMany({
        where,
        orderBy: NEWEST_FIRST,
        skip: skipFor(page),
        take: page.pageSize,
        select: FEEDBACK_WITH_PEOPLE_FIELDS,
      }),
      client.feedback.count({ where }),
    ]);
    return { items: records.map(toFeedbackWithPeopleRow), total };
  }

  async feedbackInWorkspace(
    workspaceId: string,
    feedbackId: string,
  ): Promise<FeedbackWithVisibilityRow | null> {
    const record =
      await this.prismaTransactionContext.client.feedback.findFirst({
        where: { id: feedbackId, workspaceId },
        // Every piece holds its own Topic and Visibility, so Offered Feedback — which has no
        // request to read them from — is opened the same way as an answer.
        select: {
          id: true,
          origin: true,
          feedbackRequestId: true,
          topic: true,
          giverAccountId: true,
          receiverAccountId: true,
          body: true,
          createdAt: true,
          visibility: true,
          selectedPeople: SELECTED_PEOPLE_IN_ORDER,
          ...FEEDBACK_TAGS_FIELDS,
        },
      });
    if (!record) {
      return null;
    }
    return {
      id: record.id,
      origin: record.origin,
      feedbackRequestId: record.feedbackRequestId,
      topic: record.topic,
      topicTags: topicTagsOf(record),
      giverAccountId: record.giverAccountId,
      receiverAccountId: record.receiverAccountId,
      body: record.body,
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
  ): Promise<FeedbackAskRow | null> {
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
    return record ? toFeedbackAskRow(record) : null;
  }
}

function toFeedbackAskRow(record: {
  readonly id: string;
  readonly status: string;
  readonly createdAt: Date;
  readonly feedbackRequest: StoredTags & {
    readonly id: string;
    readonly topic: string;
    readonly requesterAccountId: string;
  };
}): FeedbackAskRow {
  return {
    askId: record.id,
    feedbackRequestId: record.feedbackRequest.id,
    topic: record.feedbackRequest.topic,
    topicTags: tagsOf(record.feedbackRequest),
    requesterAccountId: record.feedbackRequest.requesterAccountId,
    status: record.status,
    createdAt: record.createdAt,
  };
}

function toFeedbackRequestRow(
  record: StoredTags & {
    readonly id: string;
    readonly requesterAccountId: string;
    readonly topic: string;
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
    topic: record.topic,
    topicTags: tagsOf(record),
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

/** A piece of Feedback's own tags, with its request's when it answers an Ask. */
interface StoredFeedbackTags extends StoredTags {
  readonly feedbackAsk: { readonly feedbackRequest: StoredTags } | null;
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

/** Offered Feedback's Topic is its Giver's, and an answer's is the request's. */
function topicTagsOf(record: StoredFeedbackTags): TagsView {
  return tagsOf(record.feedbackAsk?.feedbackRequest ?? record);
}

function toFeedbackWithPeopleRow(
  record: StoredFeedbackTags & {
    readonly id: string;
    readonly origin: FeedbackWithPeopleRow['origin'];
    readonly feedbackRequestId: string | null;
    readonly topic: string;
    readonly giverAccountId: string;
    readonly receiverAccountId: string;
    readonly body: string;
    readonly createdAt: Date;
  },
): FeedbackWithPeopleRow {
  return {
    id: record.id,
    origin: record.origin,
    feedbackRequestId: record.feedbackRequestId,
    topic: record.topic,
    topicTags: topicTagsOf(record),
    giverAccountId: record.giverAccountId,
    receiverAccountId: record.receiverAccountId,
    body: record.body,
    tags: tagsOf(record),
    createdAt: record.createdAt,
  };
}
