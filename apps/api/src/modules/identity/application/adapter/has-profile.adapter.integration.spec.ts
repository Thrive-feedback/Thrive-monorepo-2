import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { aProfileSnapshot } from '@test/support/identity.fakes';
import { v7 as uuidv7 } from 'uuid';
import type { HasProfilePort } from '../../domain/port/has-profile.port';
import { PrismaProfileQuery } from '../../infrastructure/query/prisma-profile.query';
import { FindProfileOfAccountUseCase } from '../use-cases/find-profile-of-account.use-case';
import { HasProfileAdapter } from './has-profile.adapter';

const prismaService = new PrismaService(loadConfiguration().database);
const hasProfilePort: HasProfilePort = new HasProfileAdapter(
  new FindProfileOfAccountUseCase(new PrismaProfileQuery(prismaService)),
);

const createdAccountIds: string[] = [];

async function anAccount(): Promise<string> {
  const id = uuidv7();
  await prismaService.user.create({
    data: { id, name: 'Ann Lee', email: `has-profile-${id}@acme.test` },
  });
  createdAccountIds.push(id);
  return id;
}

afterAll(async () => {
  await prismaService.user.deleteMany({
    where: { id: { in: createdAccountIds } },
  });
  await prismaService.$disconnect();
});

describe('whether an Account has a Profile, as Workspace asks it', () => {
  it('is yes once the Account has introduced itself', async () => {
    const accountId = await anAccount();
    await prismaService.profile.create({
      data: aProfileSnapshot({
        id: uuidv7(),
        accountId,
        slug: `ann.${accountId}`,
      }),
    });

    expect(await hasProfilePort.hasProfile(accountId)).toBe(true);
  });

  it('is no while the Account has not', async () => {
    expect(await hasProfilePort.hasProfile(await anAccount())).toBe(false);
  });
});
