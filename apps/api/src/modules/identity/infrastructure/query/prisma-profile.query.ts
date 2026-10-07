import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { ProfileQuery } from '../../application/query-port/profile.query-port';
import type { ProfileView } from '../../application/types/profile.types';

@Injectable()
export class PrismaProfileQuery extends ProfileQuery {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  profileOfAccount(accountId: string): Promise<ProfileView | null> {
    return this.prismaService.profile.findUnique({
      where: { accountId },
      select: { fullName: true, displayName: true, slug: true },
    });
  }
}
