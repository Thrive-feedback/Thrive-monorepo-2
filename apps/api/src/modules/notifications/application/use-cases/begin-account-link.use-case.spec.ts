import { describe, expect, it } from 'bun:test';
import {
  FakeAccountLinker,
  FakeLinkHandoff,
} from '@test/support/notifications.fakes';
import { ProviderNotSupportedError } from '../../domain/notifications.errors';
import { AccountLinkerRegistry } from '../service/account-linker-registry.service';
import { BeginAccountLinkUseCase } from './begin-account-link.use-case';

const ANN = 'account-ann';

function setUp() {
  const handoff = new FakeLinkHandoff();
  const useCase = new BeginAccountLinkUseCase(
    new AccountLinkerRegistry({ DISCORD: new FakeAccountLinker() }),
    handoff,
  );
  return { handoff, useCase };
}

describe('beginning a link', () => {
  it('sends the Member to the tool, carrying a `state` bound to them and to it', async () => {
    const { handoff, useCase } = setUp();

    const { authorizeUrl } = await useCase.execute({
      accountId: ANN,
      provider: 'DISCORD',
    });

    const state = new URL(authorizeUrl).searchParams.get('state') ?? '';
    expect(handoff.readLinkStart(state)).toEqual({
      accountId: ANN,
      provider: 'DISCORD',
    });
  });

  it('answers PROVIDER_NOT_SUPPORTED for a tool Thrive does not link', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute({ accountId: ANN, provider: 'TEAMS' }),
    ).rejects.toBeInstanceOf(ProviderNotSupportedError);
  });
});
