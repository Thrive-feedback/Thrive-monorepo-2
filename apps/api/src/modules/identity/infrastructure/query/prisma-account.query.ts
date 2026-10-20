import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { AccountQuery } from '../../application/query-port/account.query-port';
import type {
  AccountByEmailView,
  AccountBySlugView,
  AccountSummaryView,
} from '../../application/types/account.types';
import { toPhotoUrl } from '../mapper/photo-url.mapper';

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
        image: true,
        profile: { select: { fullName: true, displayName: true, slug: true } },
      },
    });
    return accounts.map((account) => ({
      accountId: account.id,
      email: account.email,
      fullName: account.profile?.fullName ?? null,
      displayName: account.profile?.displayName ?? null,
      slug: account.profile?.slug ?? null,
      photoUrl: toPhotoUrl(account.image),
    }));
  }

  async accountsWithEmails(
    emails: readonly string[],
  ): Promise<AccountByEmailView[]> {
    if (emails.length === 0) {
      return [];
    }
    const accounts = await this.prismaService.user.findMany({
      where: {
        OR: emails.map((email) => ({
          email: { equals: email, mode: 'insensitive' as const },
        })),
      },
      select: { id: true, email: true },
    });
    return accounts.map((account) => ({
      accountId: account.id,
      email: account.email,
    }));
  }

  async accountsWithSlugs(
    slugs: readonly string[],
  ): Promise<AccountBySlugView[]> {
    if (slugs.length === 0) {
      return [];
    }
    return this.prismaService.profile.findMany({
      where: { slug: { in: [...slugs] } },
      select: { accountId: true, slug: true, displayName: true },
    });
  }
}
