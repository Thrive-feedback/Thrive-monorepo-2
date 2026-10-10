import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { aProfileSnapshot } from '@test/support/identity.fakes';
import { v7 as uuidv7 } from 'uuid';
import type { AccountSummaryPort } from '../../domain/port/account-summary.port';
import { PrismaAccountQuery } from '../../infrastructure/query/prisma-account.query';
import { FindAccountSummariesUseCase } from '../use-cases/find-account-summaries.use-case';
import { AccountSummaryAdapter } from './account-summary.adapter';

const prismaService = new PrismaService(loadConfiguration().database);
const accountSummaryPort: AccountSummaryPort = new AccountSummaryAdapter(
  new FindAccountSummariesUseCase(new PrismaAccountQuery(prismaService)),
);

const createdAccountIds: string[] = [];

async function anAccount(): Promise<{ id: string; email: string }> {
  const id = uuidv7();
  const email = `account-summary-${id}@acme.test`;
  await prismaService.user.create({ data: { id, name: 'Google Name', email } });
  createdAccountIds.push(id);
  return { id, email };
}

afterAll(async () => {
  await prismaService.user.deleteMany({
    where: { id: { in: createdAccountIds } },
  });
  await prismaService.$disconnect();
});

describe('who several Accounts are, as Workspace asks it', () => {
  it('answers each with its email and Profile name, null where there is no Profile, and leaves out unknown ids', async () => {
    const introduced = await anAccount();
    await prismaService.profile.create({
      data: aProfileSnapshot({
        id: uuidv7(),
        accountId: introduced.id,
        fullName: 'Ann Lee',
        slug: `ann.${introduced.id}`,
      }),
    });
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
