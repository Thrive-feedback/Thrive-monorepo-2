import { describe, expect, it } from 'bun:test';
import { FakeLinkedAccountRepository } from '@test/support/notifications.fakes';
import { ProviderNotSupportedError } from '../../domain/notifications.errors';
import { ProviderAccount } from '../../domain/value-object/provider-account.vo';
import { NotLinkedError } from '../notifications.errors';
import { UnlinkAccountUseCase } from './unlink-account.use-case';

const ANN = 'account-ann';

async function setUp() {
  const repository = new FakeLinkedAccountRepository();
  await repository.save({
    id: 'link-1',
    accountId: ANN,
    providerAccount: ProviderAccount.of({
      provider: 'DISCORD',
      externalUserId: 'discord-user-ann',
      externalUsername: 'ann',
    }),
  });
  return { repository, useCase: new UnlinkAccountUseCase(repository) };
}

describe('unlinking', () => {
  it('deletes the stored chat account rather than marking it unused', async () => {
    const { repository, useCase } = await setUp();

    await useCase.execute({ accountId: ANN, provider: 'DISCORD' });

    // Unlinking is the Member withdrawing consent, so what was theirs is gone (#211 AC 4).
    expect(repository.saved).toEqual([]);
  });

  it('answers NOT_LINKED when there was nothing to unlink', async () => {
    const { useCase } = await setUp();
    await useCase.execute({ accountId: ANN, provider: 'DISCORD' });

    await expect(
      useCase.execute({ accountId: ANN, provider: 'DISCORD' }),
    ).rejects.toBeInstanceOf(NotLinkedError);
  });

  it('leaves another Member’s link alone', async () => {
    const { repository, useCase } = await setUp();

    await expect(
      useCase.execute({ accountId: 'account-ben', provider: 'DISCORD' }),
    ).rejects.toBeInstanceOf(NotLinkedError);
    expect(repository.saved).toHaveLength(1);
  });

  it('answers PROVIDER_NOT_SUPPORTED for a tool Thrive does not link', async () => {
    const { useCase } = await setUp();

    await expect(
      useCase.execute({ accountId: ANN, provider: 'TEAMS' }),
    ).rejects.toBeInstanceOf(ProviderNotSupportedError);
  });
});
