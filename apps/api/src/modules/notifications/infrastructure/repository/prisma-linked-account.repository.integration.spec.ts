import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { WorkspaceFixtures } from '@test/support/workspace.integration-fixtures';
import { ProviderAccount } from '../../domain/value-object/provider-account.vo';
import { PrismaLinkedAccountQuery } from '../query/prisma-linked-account.query';
import { PrismaLinkedAccountRepository } from './prisma-linked-account.repository';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const auth = createAuth(
  prismaService,
  configuration.auth,
  new UuidIdGenerator(),
);
const transactionContext = new PrismaTransactionContext(prismaService);
const repository = new PrismaLinkedAccountRepository(transactionContext);
const query = new PrismaLinkedAccountQuery(transactionContext);
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);
const idGenerator = new UuidIdGenerator();

afterAll(async () => {
  await prismaService.linkedAccount.deleteMany({});
  await fixtures.removeAll();
  await prismaService.$disconnect();
});

function aLink(
  accountId: string,
  account: Partial<{
    provider: 'DISCORD';
    externalTeamId: string;
    externalUserId: string;
    externalUsername: string;
  }> = {},
) {
  return {
    id: idGenerator.next(),
    accountId,
    providerAccount: ProviderAccount.of({
      provider: 'DISCORD',
      // Derived from the Account, so two tests cannot collide on the identity index and leave
      // a `save` quietly answering false.
      externalUserId: `discord-${accountId}`,
      externalUsername: 'ann',
      ...account,
    }),
  };
}

async function anAccount(name: string) {
  const signedIn = await fixtures.aSignedInAccount(name);
  return signedIn.accountId;
}

describe('storing a Member’s Linked Account', () => {
  it('reads back the chat account it was given, and when it was linked', async () => {
    const accountId = await anAccount('link-first');

    expect(await repository.save(aLink(accountId))).toBe(true);

    const [link] = await query.forAccount(accountId);
    expect(link?.provider).toBe('DISCORD');
    expect(link?.externalUsername).toBe('ann');
    expect(link?.linkedAt).toBeInstanceOf(Date);
  });

  it('replaces the same Member’s link to the same tool in place', async () => {
    const accountId = await anAccount('link-replace');
    expect(await repository.save(aLink(accountId))).toBe(true);

    await repository.save(
      aLink(accountId, {
        externalUserId: 'discord-user-ann-2',
        externalUsername: 'ann.again',
      }),
    );

    const links = await query.forAccount(accountId);
    expect(links).toHaveLength(1);
    expect(links[0]?.externalUsername).toBe('ann.again');
  });

  it('refuses a chat account another Member already holds', async () => {
    const ann = await anAccount('link-owner');
    const ben = await anAccount('link-claimant');
    await repository.save(aLink(ann, { externalUserId: 'discord-shared' }));

    // The unique index decides this, not a read beforehand — a check followed by a write is a
    // race two people can both win.
    expect(
      await repository.save(aLink(ben, { externalUserId: 'discord-shared' })),
    ).toBe(false);
    expect(await query.forAccount(ben)).toEqual([]);
  });

  it('keeps two identities apart when they differ only by team — the D8 trap', async () => {
    const ann = await anAccount('link-team-a');
    const ben = await anAccount('link-team-b');

    await repository.save(
      aLink(ann, { externalTeamId: 'team-1', externalUserId: 'U1' }),
    );
    const second = await repository.save(
      aLink(ben, { externalTeamId: 'team-2', externalUserId: 'U1' }),
    );

    // Both are stored, because they are genuinely different people. The point of the test is
    // what it proves about the column: were `externalTeamId` nullable, Postgres would treat two
    // NULLs as distinct and the index below would let the *same* identity in twice.
    expect(second).toBe(true);
    expect(await query.forAccount(ann)).toHaveLength(1);
    expect(await query.forAccount(ben)).toHaveLength(1);
  });

  it('holds the index for a provider with no team, where both rows store the empty string', async () => {
    const ann = await anAccount('link-noteam-a');
    const ben = await anAccount('link-noteam-b');
    await repository.save(aLink(ann, { externalUserId: 'discord-no-team' }));

    // This is the case a nullable column would silently allow. `''` is ugly and correct.
    expect(
      await repository.save(aLink(ben, { externalUserId: 'discord-no-team' })),
    ).toBe(false);
  });
});

describe('forgetting a Linked Account', () => {
  it('deletes the row, and says so', async () => {
    const accountId = await anAccount('link-unlink');
    expect(await repository.save(aLink(accountId))).toBe(true);

    expect(await repository.remove({ accountId, provider: 'DISCORD' })).toBe(
      true,
    );
    expect(await query.forAccount(accountId)).toEqual([]);
  });

  it('answers false when there was nothing to forget', async () => {
    const accountId = await anAccount('link-unlink-twice');

    expect(await repository.remove({ accountId, provider: 'DISCORD' })).toBe(
      false,
    );
  });

  it('leaves another Member’s link alone', async () => {
    const ann = await anAccount('link-keep-mine');
    const ben = await anAccount('link-keep-theirs');
    expect(
      await repository.save(aLink(ann, { externalUserId: 'discord-ann-keep' })),
    ).toBe(true);
    expect(
      await repository.save(aLink(ben, { externalUserId: 'discord-ben-keep' })),
    ).toBe(true);

    await repository.remove({ accountId: ann, provider: 'DISCORD' });

    expect(await query.forAccount(ben)).toHaveLength(1);
  });
});
