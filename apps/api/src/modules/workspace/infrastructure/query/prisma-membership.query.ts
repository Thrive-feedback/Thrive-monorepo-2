import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import { MembershipQuery } from '../../application/query-port/membership.query-port';
import type {
  MemberStatus,
  MembershipPage,
  MembershipView,
  PageRequest,
  WorkspaceMemberPage,
} from '../../application/types/membership.types';
import {
  toMembershipView,
  toWorkspaceMemberView,
} from '../mapper/membership.mapper';

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
    const where = { userId: accountId, deactivatedAt: null };
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

  async membershipInWorkspace(
    accountId: string,
    workspaceId: string,
  ): Promise<MembershipView | null> {
    const member = await this.prismaTransactionContext.client.member.findUnique(
      {
        where: { workspaceId_userId: { workspaceId, userId: accountId } },
        select: {
          role: true,
          deactivatedAt: true,
          workspace: { select: { id: true, name: true } },
        },
      },
    );
    return member && member.deactivatedAt === null
      ? toMembershipView(member)
      : null;
  }

  async membersAmong(
    workspaceId: string,
    accountIds: readonly string[],
  ): Promise<readonly string[]> {
    const members = await this.prismaTransactionContext.client.member.findMany({
      where: {
        workspaceId,
        userId: { in: [...accountIds] },
        deactivatedAt: null,
      },
      select: { userId: true },
    });
    return members.map((member) => member.userId);
  }

  async deactivatedAmong(
    workspaceId: string,
    accountIds: readonly string[],
  ): Promise<readonly string[]> {
    const members = await this.prismaTransactionContext.client.member.findMany({
      where: {
        workspaceId,
        userId: { in: [...accountIds] },
        deactivatedAt: { not: null },
      },
      select: { userId: true },
    });
    return members.map((member) => member.userId);
  }

  async membersOfWorkspace(
    workspaceId: string,
    page: PageRequest,
    status: MemberStatus,
  ): Promise<WorkspaceMemberPage> {
    const where = {
      workspaceId,
      deactivatedAt: status === 'ACTIVE' ? null : { not: null },
    };
    const [members, total] = await Promise.all([
      this.prismaTransactionContext.client.member.findMany({
        where,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (page.page - 1) * page.pageSize,
        take: page.pageSize,
        select: { userId: true, role: true },
      }),
      this.prismaTransactionContext.client.member.count({ where }),
    ]);
    return { items: members.map(toWorkspaceMemberView), total };
  }

  async adminCountOf(workspaceId: string): Promise<number> {
    return this.prismaTransactionContext.client.member.count({
      where: { workspaceId, role: 'admin', deactivatedAt: null },
    });
  }

  async isDeactivatedIn(
    accountId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const member = await this.prismaTransactionContext.client.member.findUnique(
      {
        where: { workspaceId_userId: { workspaceId, userId: accountId } },
        select: { deactivatedAt: true },
      },
    );
    return member !== null && member.deactivatedAt !== null;
  }
}
