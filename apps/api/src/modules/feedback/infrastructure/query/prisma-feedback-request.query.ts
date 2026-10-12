import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  type FeedbackAskPageRow,
  type FeedbackAskRow,
  type FeedbackRequestPageRow,
  FeedbackRequestQuery,
  type FeedbackRequestRow,
} from '../../application/query-port/feedback-request.query-port';
import type { PageRequest } from '../../application/types/feedback-request.types';
import type { AskStatusValue } from '../../domain/value-object/ask-status.vo';

/** Oldest first inside one request: the order the Members were asked in. */
const ASKS_IN_ORDER_ASKED = [{ createdAt: 'asc' }, { id: 'asc' }] satisfies {
  readonly [key: string]: 'asc';
}[];

/** Newest first across requests: what a person sent or was asked most recently comes up. */
const NEWEST_FIRST = [{ createdAt: 'desc' }, { id: 'desc' }] satisfies {
  readonly [key: string]: 'desc';
}[];

const ASK_FIELDS = {
  id: true,
  giverAccountId: true,
  status: true,
} as const;

const REQUEST_OF_ASK = {
  select: { id: true, topic: true, requesterAccountId: true },
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
        select: {
          id: true,
          requesterAccountId: true,
          topic: true,
          visibility: true,
          createdAt: true,
          asks: { orderBy: ASKS_IN_ORDER_ASKED, select: ASK_FIELDS },
        },
      });
    return record
      ? {
          id: record.id,
          requesterAccountId: record.requesterAccountId,
          topic: record.topic,
          visibility: record.visibility,
          createdAt: record.createdAt,
          asks: record.asks.map((ask) => ({
            askId: ask.id,
            giverAccountId: ask.giverAccountId,
            status: ask.status,
          })),
        }
      : null;
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
        select: {
          id: true,
          requesterAccountId: true,
          topic: true,
          visibility: true,
          createdAt: true,
          asks: { orderBy: ASKS_IN_ORDER_ASKED, select: ASK_FIELDS },
        },
      }),
      client.feedbackRequest.count({ where }),
    ]);
    return {
      items: records.map((record) => ({
        id: record.id,
        requesterAccountId: record.requesterAccountId,
        topic: record.topic,
        visibility: record.visibility,
        createdAt: record.createdAt,
        asks: record.asks.map((ask) => ({
          askId: ask.id,
          giverAccountId: ask.giverAccountId,
          status: ask.status,
        })),
      })),
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
  readonly feedbackRequest: {
    readonly id: string;
    readonly topic: string;
    readonly requesterAccountId: string;
  };
}): FeedbackAskRow {
  return {
    askId: record.id,
    feedbackRequestId: record.feedbackRequest.id,
    topic: record.feedbackRequest.topic,
    requesterAccountId: record.feedbackRequest.requesterAccountId,
    status: record.status,
    createdAt: record.createdAt,
  };
}
