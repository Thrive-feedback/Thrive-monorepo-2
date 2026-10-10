import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import { InvitationQuery } from '../../application/query-port/invitation.query-port';
import type {
  InvitationDetailView,
  InvitationPage,
} from '../../application/types/invitation.types';
import type { PageRequest } from '../../application/types/membership.types';
import {
  toInvitationDetailView,
  toInvitationView,
} from '../mapper/invitation.mapper';

@Injectable()
export class PrismaInvitationQuery extends InvitationQuery {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async openInvitationsOfWorkspace(
    workspaceId: string,
    now: Date,
    page: PageRequest,
  ): Promise<InvitationPage> {
    // The plugin keeps an Invitation `pending` past its expiry; `now` tells the two apart.
    const where = { workspaceId, status: 'pending' };
    const [invitations, total] = await Promise.all([
      this.prismaTransactionContext.client.invitation.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page.page - 1) * page.pageSize,
        take: page.pageSize,
        select: { id: true, email: true, role: true, expiresAt: true },
      }),
      this.prismaTransactionContext.client.invitation.count({ where }),
    ]);
    return {
      items: invitations.map((invitation) => toInvitationView(invitation, now)),
      total,
    };
  }

  async invitationById(
    invitationId: string,
    now: Date,
  ): Promise<InvitationDetailView | null> {
    const invitation =
      await this.prismaTransactionContext.client.invitation.findUnique({
        where: { id: invitationId },
        select: {
          id: true,
          email: true,
          status: true,
          expiresAt: true,
          inviterId: true,
          workspace: { select: { id: true, name: true } },
        },
      });
    return invitation ? toInvitationDetailView(invitation, now) : null;
  }
}
