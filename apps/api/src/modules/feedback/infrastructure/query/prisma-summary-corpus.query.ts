import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  type SummaryCorpusFreshness,
  SummaryCorpusQuery,
  type SummarySourceRow,
} from '../../application/query-port/summary-corpus.query-port';
import type { SummaryPeriodRange } from '../../domain/value-object/summary-period.vo';

/** Oldest first, so the model reads a period the way it happened. */
const OLDEST_FIRST = { createdAt: 'asc' } as const;

interface FreshnessRecord {
  readonly id: string;
  readonly createdAt: Date;
  readonly total: bigint;
}

/**
 * Reads what was written to one Member out of Feedback's own tables. Both are this module's, so
 * reading them together is a query, not a cross-module join (`BE_03` R7).
 */
@Injectable()
export class PrismaSummaryCorpusQuery extends SummaryCorpusQuery {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async writtenTo(
    workspaceId: string,
    accountId: string,
    within: SummaryPeriodRange,
  ): Promise<readonly SummarySourceRow[]> {
    const { client } = this.prismaTransactionContext;
    const written = { gte: within.from, lt: within.until };

    const [feedback, kudos] = await Promise.all([
      client.feedback.findMany({
        // Through the Receivers, not `feedback.receiverAccountId`: that column holds only the
        // first of several (ADR 0061).
        where: {
          workspaceId,
          receivers: { some: { accountId } },
          createdAt: written,
        },
        orderBy: OLDEST_FIRST,
        select: { id: true, message: true, createdAt: true },
      }),
      client.kudos.findMany({
        where: {
          workspaceId,
          recipients: { some: { accountId } },
          createdAt: written,
        },
        orderBy: OLDEST_FIRST,
        select: { id: true, message: true, createdAt: true },
      }),
    ]);

    return [
      ...feedback.map((row) => ({ ...row, kind: 'FEEDBACK' as const })),
      ...kudos.map((row) => ({ ...row, kind: 'KUDOS' as const })),
    ].sort((one, other) => one.createdAt.getTime() - other.createdAt.getTime());
  }

  async freshnessOf(
    workspaceId: string,
    accountId: string,
    within: SummaryPeriodRange,
  ): Promise<SummaryCorpusFreshness> {
    // One statement over both tables rather than four round trips, because this runs on every
    // view of the page. Counting and taking the newest in the same pass keeps them agreeing.
    const [newest] = await this.prismaTransactionContext.client.$queryRaw<
      FreshnessRecord[]
    >`
      WITH written AS (
        SELECT f."id", f."createdAt"
          FROM "feedback" f
          JOIN "feedback_receiver" r ON r."feedbackId" = f."id"
         WHERE f."workspaceId" = ${workspaceId}
           AND r."accountId" = ${accountId}
           AND f."createdAt" >= ${within.from}
           AND f."createdAt" < ${within.until}
        UNION ALL
        SELECT k."id", k."createdAt"
          FROM "kudos" k
          JOIN "kudos_recipient" kr ON kr."kudosId" = k."id"
         WHERE k."workspaceId" = ${workspaceId}
           AND kr."accountId" = ${accountId}
           AND k."createdAt" >= ${within.from}
           AND k."createdAt" < ${within.until}
      )
      SELECT "id", "createdAt", (SELECT COUNT(*) FROM written) AS "total"
        FROM written
       ORDER BY "createdAt" DESC, "id" DESC
       LIMIT 1`;

    return newest === undefined
      ? { count: 0, newest: null }
      : {
          count: Number(newest.total),
          newest: { id: newest.id, createdAt: newest.createdAt },
        };
  }
}
