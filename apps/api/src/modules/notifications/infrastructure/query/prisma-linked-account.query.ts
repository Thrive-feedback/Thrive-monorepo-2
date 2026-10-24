import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  LinkedAccountQuery,
  type ReachableAccount,
} from '../../application/query-port/linked-account.query-port';
import type { LinkedAccountView } from '../../application/types/linked-account.types';
import {
  CHAT_PROVIDERS,
  type ChatProviderValue,
} from '../../domain/value-object/chat-provider.vo';

/** The columns sending a message needs. A screen never sees these. */
const REACHABLE_FIELDS = {
  accountId: true,
  provider: true,
  externalUserId: true,
  directChannelId: true,
} as const;

/** The columns a Settings row needs. The chat-tool ids are not among them. */
const VIEW_FIELDS = {
  provider: true,
  externalUsername: true,
  linkedAt: true,
} as const;

@Injectable()
export class PrismaLinkedAccountQuery extends LinkedAccountQuery {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async forAccount(accountId: string): Promise<readonly LinkedAccountView[]> {
    const rows =
      await this.prismaTransactionContext.client.linkedAccount.findMany({
        where: { accountId },
        orderBy: { provider: 'asc' },
        select: VIEW_FIELDS,
      });
    return rows.filter(isKnownProvider);
  }

  async reachableFor(
    accountIds: readonly string[],
  ): Promise<readonly ReachableAccount[]> {
    if (accountIds.length === 0) {
      return [];
    }
    const rows =
      await this.prismaTransactionContext.client.linkedAccount.findMany({
        where: { accountId: { in: [...new Set(accountIds)] } },
        select: REACHABLE_FIELDS,
      });
    return rows.filter(isKnownProvider);
  }
}

/**
 * The column is text, as every provider value is stored. Only rows this release knows how to
 * name are answered, so a tool that has been retired reads as nothing rather than as a value
 * nothing downstream can draw or send to.
 */
function isKnownProvider<Row extends { readonly provider: string }>(
  row: Row,
): row is Row & { readonly provider: ChatProviderValue } {
  return (CHAT_PROVIDERS as readonly string[]).includes(row.provider);
}
