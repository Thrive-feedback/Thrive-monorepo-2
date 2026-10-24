import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import { LinkedAccountQuery } from '../../application/query-port/linked-account.query-port';
import type { LinkedAccountView } from '../../application/types/linked-account.types';
import { CHAT_PROVIDERS } from '../../domain/value-object/chat-provider.vo';

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
    // The column is text, as every provider value is stored; only rows this release knows how
    // to name are answered, so a tool that has been retired reads as nothing rather than as a
    // value the screen cannot draw.
    return rows.filter(isKnownProvider);
  }
}

function isKnownProvider(
  row: { readonly provider: string } & Omit<LinkedAccountView, 'provider'>,
): row is LinkedAccountView {
  return (CHAT_PROVIDERS as readonly string[]).includes(row.provider);
}
