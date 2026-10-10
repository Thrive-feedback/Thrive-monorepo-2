import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { aProfileSnapshot } from '@test/support/identity.fakes';
import { v7 as uuidv7 } from 'uuid';
import type { ProfileNamePort } from '../../domain/port/profile-name.port';
import { PrismaProfileQuery } from '../../infrastructure/query/prisma-profile.query';
import { FindProfileOfAccountUseCase } from '../use-cases/find-profile-of-account.use-case';
import { ProfileNameAdapter } from './profile-name.adapter';

const prismaService = new PrismaService(loadConfiguration().database);
const profileNamePort: ProfileNamePort = new ProfileNameAdapter(
  new FindProfileOfAccountUseCase(new PrismaProfileQuery(prismaService)),
);

const createdAccountIds: string[] = [];

async function anAccount(): Promise<string> {
  const id = uuidv7();
  await prismaService.user.create({
    data: { id, name: 'Google Name', email: `profile-name-${id}@acme.test` },
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

describe('the name an Account introduced itself with, as Workspace asks it', () => {
  it('is the Profile full name, not the Google account name', async () => {
    const accountId = await anAccount();
    await prismaService.profile.create({
      data: aProfileSnapshot({
        id: uuidv7(),
        accountId,
        fullName: 'Ann Lee',
        slug: `ann.${accountId}`,
      }),
    });

    expect(await profileNamePort.fullNameOf(accountId)).toBe('Ann Lee');
  });

  it('is null while the Account has not introduced itself', async () => {
    expect(await profileNamePort.fullNameOf(await anAccount())).toBeNull();
  });
});
