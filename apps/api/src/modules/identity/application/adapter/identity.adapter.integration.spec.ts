import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { aProfileSnapshot } from '@test/support/identity.fakes';
import { v7 as uuidv7 } from 'uuid';
import type { AccountByEmailPort } from '../../domain/port/account-by-email.port';
import type { AccountSummaryPort } from '../../domain/port/account-summary.port';
import type { HasProfilePort } from '../../domain/port/has-profile.port';
import type { ProfileNamePort } from '../../domain/port/profile-name.port';
import { PrismaAccountQuery } from '../../infrastructure/query/prisma-account.query';
import { PrismaProfileQuery } from '../../infrastructure/query/prisma-profile.query';
import { FindAccountSummariesUseCase } from '../use-cases/find-account-summaries.use-case';
import { FindAccountsByEmailUseCase } from '../use-cases/find-accounts-by-email.use-case';
import { FindProfileOfAccountUseCase } from '../use-cases/find-profile-of-account.use-case';
import { IdentityAdapter } from './identity.adapter';

const prismaService = new PrismaService(loadConfiguration().database);
const identityAdapter = new IdentityAdapter(
  new FindProfileOfAccountUseCase(new PrismaProfileQuery(prismaService)),
  new FindAccountSummariesUseCase(new PrismaAccountQuery(prismaService)),
  new FindAccountsByEmailUseCase(new PrismaAccountQuery(prismaService)),
);
const hasProfilePort: HasProfilePort = identityAdapter;
const profileNamePort: ProfileNamePort = identityAdapter;
const accountSummaryPort: AccountSummaryPort = identityAdapter;
const accountByEmailPort: AccountByEmailPort = identityAdapter;

const createdAccountIds: string[] = [];

const ANN_PHOTO = 'https://lh3.googleusercontent.com/a/ann=s96-c';

async function anAccount(): Promise<{ id: string; email: string }> {
  const id = uuidv7();
  const email = `identity-adapter-${id}@acme.test`;
  await prismaService.user.create({ data: { id, name: 'Google Name', email } });
  createdAccountIds.push(id);
  return { id, email };
}

async function withGooglePhoto(id: string, image: string): Promise<void> {
  await prismaService.user.update({ where: { id }, data: { image } });
}

async function introduce(
  accountId: string,
  fullName = 'Ann Lee',
  displayName = 'Ann',
) {
  await prismaService.profile.create({
    data: aProfileSnapshot({
      id: uuidv7(),
      accountId,
      fullName,
      displayName,
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
  it('is the Profile Display name, not its full name or the Google account name', async () => {
    const { id } = await anAccount();
    await introduce(id, 'Ann Lee', 'Annie');

    expect(await profileNamePort.displayNameOf(id)).toBe('Annie');
  });

  it('is null while the Account has not introduced itself', async () => {
    const { id } = await anAccount();

    expect(await profileNamePort.displayNameOf(id)).toBeNull();
  });
});

describe('who several Accounts are, as Workspace asks it', () => {
  it('answers each with its email, Profile names and Google photo, null where there is none, and leaves out unknown ids', async () => {
    const introduced = await anAccount();
    await introduce(introduced.id, 'Ann Lee');
    await withGooglePhoto(introduced.id, ANN_PHOTO);
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
          displayName: 'Ann',
          photoUrl: ANN_PHOTO,
        },
        {
          accountId: notIntroduced.id,
          email: notIntroduced.email,
          fullName: null,
          displayName: null,
          photoUrl: null,
        },
      ].sort((a, b) => a.accountId.localeCompare(b.accountId)),
    );
  });

  it('answers an empty batch with nobody, without asking the database', async () => {
    expect(await accountSummaryPort.summariesOf([])).toEqual([]);
  });
});

describe('finding Accounts by the address they sign in with', () => {
  it('answers the Accounts among the addresses, whatever their case, leaving out the rest', async () => {
    const ann = await anAccount();

    expect(
      await accountByEmailPort.accountsWithEmails([
        ann.email.toUpperCase(),
        'nobody@acme.test',
      ]),
    ).toEqual([{ accountId: ann.id, email: ann.email }]);
  });

  it('answers an empty batch with nobody, without asking the database', async () => {
    expect(await accountByEmailPort.accountsWithEmails([])).toEqual([]);
  });
});
