import { describe, expect, it } from 'bun:test';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import {
  FakeAccountLinker,
  FakeLinkedAccountRepository,
  FakeLinkHandoff,
} from '@test/support/notifications.fakes';
import { ProviderNotSupportedError } from '../../domain/notifications.errors';
import {
  AccountAlreadyLinkedError,
  LinkRefusedError,
  LinkStateInvalidError,
} from '../notifications.errors';
import { AccountLinkerRegistry } from '../service/account-linker-registry.service';
import {
  type CompleteAccountLinkInput,
  CompleteAccountLinkUseCase,
} from './complete-account-link.use-case';

const ANN = 'account-ann';
const BEN = 'account-ben';
const LINK_ID = '0199a0f0-0000-7000-8000-00000000lin1';

function setUp() {
  const linker = new FakeAccountLinker();
  const handoff = new FakeLinkHandoff();
  const repository = new FakeLinkedAccountRepository();
  const useCase = new CompleteAccountLinkUseCase(
    new AccountLinkerRegistry({ DISCORD: linker }),
    handoff,
    repository,
    new FakeIdGenerator(LINK_ID, 'second-id', 'third-id'),
  );
  const completing = (
    overrides: Partial<CompleteAccountLinkInput> = {},
  ): CompleteAccountLinkInput => ({
    accountId: ANN,
    provider: 'DISCORD',
    code: 'a-code',
    state: handoff.signLinkStart({ accountId: ANN, provider: 'DISCORD' }),
    ...overrides,
  });
  return { linker, handoff, repository, useCase, completing };
}

describe('finishing a link', () => {
  it('stores the account the tool itself reported, and names it back', async () => {
    const { linker, repository, useCase, completing } = setUp();
    linker.withIdentity({
      externalUserId: 'discord-user-ann',
      externalUsername: 'ann#0001',
    });

    const link = await useCase.execute(completing());

    expect(link).toEqual({ provider: 'DISCORD', externalUsername: 'ann#0001' });
    expect(repository.saved).toHaveLength(1);
    const stored = repository.saved[0];
    expect(stored?.accountId).toBe(ANN);
    expect(stored?.providerAccount.externalUserId).toBe('discord-user-ann');
  });

  it('stores an empty team for a provider that has none, never null', async () => {
    const { repository, useCase, completing } = setUp();

    await useCase.execute(completing());

    // The nullable version of this column is the trap: Postgres treats NULLs as distinct, so a
    // unique index over it would silently stop holding (design 0021 D8).
    expect(repository.saved[0]?.providerAccount.externalTeamId).toBe('');
  });

  it('never keeps the user access token — nothing but the identity is stored', async () => {
    const { repository, useCase, completing } = setUp();

    await useCase.execute(completing());

    const stored = JSON.stringify(repository.saved[0]);
    expect(stored).not.toContain('a-code');
    expect(stored).not.toContain('token');
  });
});

describe('refusing a return that did not start here', () => {
  it('refuses a `state` this did not sign', async () => {
    const { linker, useCase, completing } = setUp();

    await expect(
      useCase.execute(
        completing({ state: 'link:{"accountId":"account-ann"}x' }),
      ),
    ).rejects.toBeInstanceOf(LinkStateInvalidError);
    // Nothing reached the chat tool: the refusal comes before the exchange.
    expect(linker.exchangedCodes).toEqual([]);
  });

  it('refuses an expired `state`', async () => {
    const { handoff, useCase, completing } = setUp();
    const completion = completing();
    handoff.treatingEverythingAsStale();

    await expect(useCase.execute(completion)).rejects.toBeInstanceOf(
      LinkStateInvalidError,
    );
  });

  it('refuses a `state` signed for another Account', async () => {
    const { handoff, linker, useCase, completing } = setUp();

    await expect(
      useCase.execute(
        completing({
          state: handoff.signLinkStart({
            accountId: BEN,
            provider: 'DISCORD',
          }),
        }),
      ),
    ).rejects.toBeInstanceOf(LinkStateInvalidError);
    // This is the one that matters: without it, a crafted link attaches somebody else's chat
    // account to this person's Thrive Account and every message meant for them goes elsewhere.
    expect(linker.exchangedCodes).toEqual([]);
  });

  it('refuses a `state` signed for another chat tool', async () => {
    const { handoff, useCase, completing } = setUp();

    await expect(
      useCase.execute(
        completing({
          state: handoff.signLinkStart({
            accountId: ANN,
            // A tool this release does not link, signed by us: the provider claim still has to
            // match the one in the path.
            provider: 'SLACK' as never,
          }),
        }),
      ),
    ).rejects.toBeInstanceOf(LinkStateInvalidError);
  });
});

describe('refusing the rest', () => {
  it('answers PROVIDER_NOT_SUPPORTED for a tool Thrive does not link', async () => {
    const { useCase, completing } = setUp();

    await expect(
      useCase.execute(completing({ provider: 'TEAMS' })),
    ).rejects.toBeInstanceOf(ProviderNotSupportedError);
  });

  it('answers LINK_REFUSED when the tool will not say who authorised', async () => {
    const { linker, useCase, completing } = setUp();
    linker.refusingTheExchange();

    await expect(useCase.execute(completing())).rejects.toBeInstanceOf(
      LinkRefusedError,
    );
  });

  it('refuses a chat account another Thrive Account already holds', async () => {
    const { repository, useCase, completing, handoff } = setUp();
    await useCase.execute(completing());

    await expect(
      useCase.execute(
        completing({
          accountId: BEN,
          state: handoff.signLinkStart({
            accountId: BEN,
            provider: 'DISCORD',
          }),
        }),
      ),
    ).rejects.toBeInstanceOf(AccountAlreadyLinkedError);
    expect(repository.saved).toHaveLength(1);
  });

  it('lets the same person link again, replacing what was there', async () => {
    const { linker, repository, useCase, completing } = setUp();
    await useCase.execute(completing());
    linker.withIdentity({
      externalUserId: 'discord-user-ann-2',
      externalUsername: 'ann.again',
    });

    await useCase.execute(completing());

    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]?.providerAccount.externalUsername).toBe(
      'ann.again',
    );
  });
});
