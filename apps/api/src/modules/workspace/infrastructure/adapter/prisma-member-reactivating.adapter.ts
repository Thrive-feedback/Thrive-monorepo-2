import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  MemberReactivating,
  type MemberReactivation,
} from '../../application/port/member-reactivating.port';

/**
 * Clears the date Deactivating stamped on the `member` row (ADR 0047). The Role was never touched,
 * so the person comes back with the one they had. Writes through `client`, so it joins the use
 * case's unit of work and rolls back with it.
 */
@Injectable()
export class PrismaMemberReactivatingAdapter extends MemberReactivating {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async reactivate(reactivation: MemberReactivation): Promise<void> {
    const { count } =
      await this.prismaTransactionContext.client.member.updateMany({
        where: {
          workspaceId: reactivation.workspaceId,
          userId: reactivation.accountId,
          deactivatedAt: { not: null },
        },
        data: { deactivatedAt: null },
      });
    if (count === 0) {
      // The use case found this Member Deactivated a moment ago, inside the same lock.
      throw new Error('The Member being Reactivated is gone.');
    }
  }
}
