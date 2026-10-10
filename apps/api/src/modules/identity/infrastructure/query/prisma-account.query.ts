import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { AccountQuery } from '../../application/query-port/account.query-port';
import type { AccountSummaryView } from '../../application/types/account.types';

/** One query for the whole batch, with each Account's Profile alongside. */
@Injectable()
export class PrismaAccountQuery extends AccountQuery {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async summariesOf(
    accountIds: readonly string[],
  ): Promise<AccountSummaryView[]> {
    if (accountIds.length === 0) {
      return [];
    }
    const accounts = await this.prismaService.user.findMany({
      where: { id: { in: [...accountIds] } },
      select: {
        id: true,
        email: true,
        profile: { select: { fullName: true } },
      },
    });
    return accounts.map((account) => ({
      accountId: account.id,
      email: account.email,
      fullName: account.profile?.fullName ?? null,
    }));
  }
}
