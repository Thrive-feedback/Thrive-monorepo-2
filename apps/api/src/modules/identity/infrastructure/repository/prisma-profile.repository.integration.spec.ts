import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { aProfileSnapshot } from '@test/support/identity.fakes';
import { v7 as uuidv7 } from 'uuid';
import {
  ProfileAlreadyExistsError,
  ProfileSlugTakenError,
} from '../../application/profile.errors';
import type { ProfileQuery } from '../../application/query-port/profile.query-port';
import { Profile } from '../../domain/entity/profile.entity';
import type { ProfileRepository } from '../../domain/repository/profile-repository.port';
import { ProfileSlug } from '../../domain/value-object/profile-slug.vo';
import { PrismaProfileQuery } from '../query/prisma-profile.query';
import { PrismaProfileRepository } from './prisma-profile.repository';

const prismaService = new PrismaService(loadConfiguration().database);
const profileRepository: ProfileRepository = new PrismaProfileRepository(
  prismaService,
);
const profileQuery: ProfileQuery = new PrismaProfileQuery(prismaService);

const createdAccountIds: string[] = [];

/** An Account, as Better Auth stores one, with a slug nobody else in the run can hold. */
async function anAccount() {
  const id = uuidv7();
  await prismaService.user.create({
    data: { id, name: 'Ann Lee', email: `profile-${id}@acme.test` },
  });
  createdAccountIds.push(id);
  return { accountId: id, slug: `ann.lee.${id}` };
}

function aProfileFor(account: { accountId: string; slug: string }) {
  return Profile.restore(
    aProfileSnapshot({
      id: uuidv7(),
      accountId: account.accountId,
      slug: account.slug,
    }),
  );
}

afterAll(async () => {
  // A Profile goes with its Account.
  await prismaService.user.deleteMany({
    where: { id: { in: createdAccountIds } },
  });
  await prismaService.$disconnect();
});

describe('Profiles in Postgres, through the repository', () => {
  it('gives back what was saved', async () => {
    const account = await anAccount();
    const profile = aProfileFor(account);

    await profileRepository.save(profile);

    expect(
      (await profileRepository.findByAccountId(account.accountId))?.snapshot(),
    ).toEqual(profile.snapshot());
  });

  it('finds no Profile for an Account that has not introduced itself', async () => {
    const { accountId } = await anAccount();

    expect(await profileRepository.findByAccountId(accountId)).toBeNull();
  });

  it('answers which of the asked slugs are held', async () => {
    const account = await anAccount();
    await profileRepository.save(aProfileFor(account));
    const held = ProfileSlug.of(account.slug);
    const free = ProfileSlug.of(`${account.slug}-2`);

    const taken = await profileRepository.takenSlugs([held, free]);

    expect(taken.map(String)).toEqual([account.slug]);
  });

  it('refuses a second Profile with the same slug', async () => {
    const first = await anAccount();
    const second = await anAccount();
    await profileRepository.save(aProfileFor(first));

    await expect(
      profileRepository.save(aProfileFor({ ...second, slug: first.slug })),
    ).rejects.toThrow(ProfileSlugTakenError);
  });

  it('refuses a second Profile for the same Account', async () => {
    const account = await anAccount();
    await profileRepository.save(aProfileFor(account));

    await expect(
      profileRepository.save(
        aProfileFor({ ...account, slug: `${account.slug}-2` }),
      ),
    ).rejects.toThrow(ProfileAlreadyExistsError);
  });
});

describe('Profiles in Postgres, through the query', () => {
  it("reads an Account's Profile as the signed-in screens show it", async () => {
    const account = await anAccount();
    await profileRepository.save(aProfileFor(account));

    expect(await profileQuery.profileOfAccount(account.accountId)).toEqual({
      fullName: 'Ann Lee',
      displayName: 'Ann',
      slug: account.slug,
    });
  });

  it('reads no Profile for an Account that has not introduced itself', async () => {
    const { accountId } = await anAccount();

    expect(await profileQuery.profileOfAccount(accountId)).toBeNull();
  });
});
