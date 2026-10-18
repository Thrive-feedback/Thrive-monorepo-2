import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import { InvitationSettling } from '../../application/port/invitation-settling.port';

/**
 * Writes the status itself, because the plugin's accept would add the person a second time.
 * Writes through `client`, so it joins the use case's unit of work and rolls back with it.
 */
@Injectable()
export class PrismaInvitationSettlingAdapter extends InvitationSettling {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async settleAccepted(invitationId: string): Promise<void> {
    await this.prismaTransactionContext.client.invitation.updateMany({
      where: { id: invitationId, status: 'pending' },
      data: { status: 'accepted' },
    });
  }
}
