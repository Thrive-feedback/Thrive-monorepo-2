import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  MemberDeactivating,
  type MemberDeactivation,
} from '../../application/port/member-deactivating.port';

/**
 * Stamps the `member` row rather than calling the organization plugin, whose only way to end a
 * membership deletes the row and the Role and name with it (ADR 0047). Writes through `client`,
 * so it joins the use case's unit of work and rolls back with it.
 */
@Injectable()
export class PrismaMemberDeactivatingAdapter extends MemberDeactivating {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async deactivate(deactivation: MemberDeactivation): Promise<void> {
    const { count } =
      await this.prismaTransactionContext.client.member.updateMany({
        where: {
          workspaceId: deactivation.workspaceId,
          userId: deactivation.accountId,
          deactivatedAt: null,
        },
        data: { deactivatedAt: deactivation.deactivatedAt },
      });
    if (count === 0) {
      // The use case found this Member active a moment ago, inside the same lock.
      throw new Error('The Member being Deactivated is gone.');
    }
  }
}
