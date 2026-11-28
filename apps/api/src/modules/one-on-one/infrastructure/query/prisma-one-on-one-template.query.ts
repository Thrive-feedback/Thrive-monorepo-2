import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import { OneOnOneTemplateQuery } from '../../application/query-port/one-on-one-template.query-port';
import type {
  OneOnOneTemplateNameRow,
  OneOnOneTemplateRow,
} from '../../application/types/one-on-one-template.types';
import { toOneOnOneTemplateRow } from '../mapper/one-on-one-template.mapper';

@Injectable()
export class PrismaOneOnOneTemplateQuery extends OneOnOneTemplateQuery {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async listSeenBy(
    workspaceId: string,
    accountId: string,
  ): Promise<readonly OneOnOneTemplateRow[]> {
    // Bounded: each layer keeps at most `MAX_TEMPLATES_PER_LAYER`, and a Member sees two layers.
    const records =
      await this.prismaTransactionContext.client.oneOnOneTemplate.findMany({
        where: {
          workspaceId,
          removedAt: null,
          OR: [
            { scope: 'WORKSPACE' },
            { scope: 'PERSONAL', ownerAccountId: accountId },
          ],
        },
        // WORKSPACE sorts before PERSONAL, as the enum declares them.
        orderBy: [{ scope: 'asc' }, { name: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          scope: true,
          ownerAccountId: true,
          name: true,
          suggestedWhen: true,
          questions: true,
        },
      });
    return records.map(toOneOnOneTemplateRow);
  }

  async namesOf(
    workspaceId: string,
    templateIds: readonly string[],
  ): Promise<readonly OneOnOneTemplateNameRow[]> {
    if (templateIds.length === 0) {
      return [];
    }
    // Removed ones too: a meeting that used one keeps its name.
    return this.prismaTransactionContext.client.oneOnOneTemplate.findMany({
      where: { workspaceId, id: { in: [...templateIds] } },
      select: { id: true, name: true },
    });
  }
}
