import { Prisma } from '@app/infrastructure/database/generated/client';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  ProfileAlreadyExistsError,
  ProfileSlugTakenError,
} from '../../application/profile.errors';
import type { Profile } from '../../domain/entity/profile.entity';
import { ProfileRepository } from '../../domain/repository/profile-repository.port';
import { ProfileSlug } from '../../domain/value-object/profile-slug.vo';
import { toProfile, toProfileRecord } from '../mapper/profile.mapper';

const UNIQUE_VIOLATION = 'P2002';
const SLUG_INDEX = 'profile_slug_key';
const ACCOUNT_INDEX = 'profile_accountId_key';

/**
 * With a driver adapter, Prisma names the violated index only deep inside `meta`, in a
 * shape it does not type, so the index name is looked for in the whole of it.
 */
function violatedIndex(error: unknown): string | null {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== UNIQUE_VIOLATION
  ) {
    return null;
  }
  const meta = JSON.stringify(error.meta ?? {});
  return (
    [SLUG_INDEX, ACCOUNT_INDEX].find((index) => meta.includes(index)) ?? null
  );
}

@Injectable()
export class PrismaProfileRepository extends ProfileRepository {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async findByAccountId(accountId: string): Promise<Profile | null> {
    const record = await this.prismaService.profile.findUnique({
      where: { accountId },
    });
    return record ? toProfile(record) : null;
  }

  async takenSlugs(slugs: readonly ProfileSlug[]): Promise<ProfileSlug[]> {
    const records = await this.prismaService.profile.findMany({
      where: { slug: { in: slugs.map((slug) => slug.toString()) } },
      select: { slug: true },
    });
    return records.map((record) => ProfileSlug.of(record.slug));
  }

  async save(profile: Profile): Promise<void> {
    try {
      await this.prismaService.profile.create({
        data: toProfileRecord(profile),
      });
    } catch (error) {
      const index = violatedIndex(error);
      if (index === SLUG_INDEX) {
        throw new ProfileSlugTakenError();
      }
      if (index === ACCOUNT_INDEX) {
        throw new ProfileAlreadyExistsError();
      }
      throw error;
    }
  }
}
