import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import { MembershipQuery } from '../../application/query-port/membership.query-port';
import type {
  MembershipPage,
  PageRequest,
} from '../../application/types/membership.types';
import { toMembershipView } from '../mapper/membership.mapper';

/** Reads through `client`, so a check made inside a unit of work joins its transaction. */
@Injectable()
export class PrismaMembershipQuery extends MembershipQuery {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async membershipsOfAccount(
    accountId: string,
    page: PageRequest,
  ): Promise<MembershipPage> {
    const where = { userId: accountId };
    const [members, total] = await Promise.all([
      this.prismaTransactionContext.client.member.findMany({
        where,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (page.page - 1) * page.pageSize,
        take: page.pageSize,
        select: {
          role: true,
          workspace: { select: { id: true, name: true } },
        },
      }),
      this.prismaTransactionContext.client.member.count({ where }),
    ]);
    return { items: members.map(toMembershipView), total };
  }
}
