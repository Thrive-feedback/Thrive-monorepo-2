import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { aProfileSnapshot } from '@test/support/identity.fakes';
import { v7 as uuidv7 } from 'uuid';
import type { AccountSummaryPort } from '../../domain/port/account-summary.port';
import type { HasProfilePort } from '../../domain/port/has-profile.port';
import type { ProfileNamePort } from '../../domain/port/profile-name.port';
import { PrismaAccountQuery } from '../../infrastructure/query/prisma-account.query';
import { PrismaProfileQuery } from '../../infrastructure/query/prisma-profile.query';
import { FindAccountSummariesUseCase } from '../use-cases/find-account-summaries.use-case';
import { FindProfileOfAccountUseCase } from '../use-cases/find-profile-of-account.use-case';
import { IdentityAdapter } from './identity.adapter';

const prismaService = new PrismaService(loadConfiguration().database);
const identityAdapter = new IdentityAdapter(
  new FindProfileOfAccountUseCase(new PrismaProfileQuery(prismaService)),
  new FindAccountSummariesUseCase(new PrismaAccountQuery(prismaService)),
);
const hasProfilePort: HasProfilePort = identityAdapter;
const profileNamePort: ProfileNamePort = identityAdapter;
const accountSummaryPort: AccountSummaryPort = identityAdapter;

const createdAccountIds: string[] = [];

async function anAccount(): Promise<{ id: string; email: string }> {
  const id = uuidv7();
  const email = `identity-adapter-${id}@acme.test`;
  await prismaService.user.create({ data: { id, name: 'Google Name', email } });
  createdAccountIds.push(id);
  return { id, email };
}

async function introduce(accountId: string, fullName = 'Ann Lee') {
  await prismaService.profile.create({
    data: aProfileSnapshot({
      id: uuidv7(),
      accountId,
      fullName,
      slug: `ann.${accountId}`,
    }),
  });
}

afterAll(async () => {
  await prismaService.user.deleteMany({
    where: { id: { in: createdAccountIds } },
  });
  await prismaService.$disconnect();
});

describe('whether an Account has a Profile, as Workspace asks it', () => {
  it('is yes once the Account has introduced itself', async () => {
    const { id } = await anAccount();
    await introduce(id);

    expect(await hasProfilePort.hasProfile(id)).toBe(true);
  });

  it('is no while the Account has not', async () => {
    const { id } = await anAccount();

    expect(await hasProfilePort.hasProfile(id)).toBe(false);
  });
});

describe('the name an Account introduced itself with, as Workspace asks it', () => {
  it('is the Profile full name, not the Google account name', async () => {
    const { id } = await anAccount();
    await introduce(id, 'Ann Lee');

    expect(await profileNamePort.fullNameOf(id)).toBe('Ann Lee');
  });

  it('is null while the Account has not introduced itself', async () => {
    const { id } = await anAccount();

    expect(await profileNamePort.fullNameOf(id)).toBeNull();
  });
});

describe('who several Accounts are, as Workspace asks it', () => {
  it('answers each with its email and Profile name, null where there is no Profile, and leaves out unknown ids', async () => {
    const introduced = await anAccount();
    await introduce(introduced.id, 'Ann Lee');
    const notIntroduced = await anAccount();

    const summaries = await accountSummaryPort.summariesOf([
      introduced.id,
      notIntroduced.id,
      uuidv7(),
    ]);

    expect(
      [...summaries].sort((a, b) => a.accountId.localeCompare(b.accountId)),
    ).toEqual(
      [
        {
          accountId: introduced.id,
          email: introduced.email,
          fullName: 'Ann Lee',
        },
        {
          accountId: notIntroduced.id,
          email: notIntroduced.email,
          fullName: null,
        },
      ].sort((a, b) => a.accountId.localeCompare(b.accountId)),
    );
  });

  it('answers an empty batch with nobody, without asking the database', async () => {
    expect(await accountSummaryPort.summariesOf([])).toEqual([]);
  });
});
