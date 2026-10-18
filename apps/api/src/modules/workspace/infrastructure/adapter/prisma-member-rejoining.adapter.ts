import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  type MemberRejoin,
  MemberRejoining,
} from '../../application/port/member-rejoining.port';
import { toStoredRole } from '../mapper/membership.mapper';

/**
 * Settles the Invitation and reactivates the kept `member` row itself, because the plugin's
 * accept would add a second row and fail on the unique index (ADR 0050). Writes through
 * `client`, so both changes join the use case's unit of work and roll back together.
 */
@Injectable()
export class PrismaMemberRejoiningAdapter extends MemberRejoining {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async rejoin(rejoin: MemberRejoin): Promise<void> {
    const { client } = this.prismaTransactionContext;
    const settled = await client.invitation.updateMany({
      where: { id: rejoin.invitationId, status: 'pending' },
      data: { status: 'accepted' },
    });
    const reactivated = await client.member.updateMany({
      where: {
        workspaceId: rejoin.workspaceId,
        userId: rejoin.accountId,
        deactivatedAt: { not: null },
      },
      data: { deactivatedAt: null, role: toStoredRole(rejoin.role) },
    });
    if (settled.count === 0 || reactivated.count === 0) {
      // The use case found both a moment ago, inside the same lock.
      throw new Error(
        'The Invitation or the Member being brought back is gone.',
      );
    }
  }
}
