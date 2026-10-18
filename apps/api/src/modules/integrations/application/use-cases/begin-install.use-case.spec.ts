import { describe, expect, it } from 'bun:test';
import {
  FakeChatInstaller,
  FakeInstallHandoff,
} from '@test/support/integrations.fakes';
import { ProviderNotSupportedError } from '../../domain/integrations.errors';
import { NotAllowedToManageIntegrationsError } from '../integrations.errors';
import { ChatInstallerRegistry } from '../service/chat-installer-registry.service';
import {
  type BeginInstallInput,
  BeginInstallUseCase,
} from './begin-install.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const ANN = 'account-ann';

function beginning(
  overrides: Partial<BeginInstallInput> = {},
): BeginInstallInput {
  return {
    workspaceId: WORKSPACE_ID,
    accountId: ANN,
    provider: 'DISCORD',
    isAdmin: true,
    ...overrides,
  };
}

function setUp() {
  const installer = new FakeChatInstaller();
  const handoff = new FakeInstallHandoff();
  const useCase = new BeginInstallUseCase(
    new ChatInstallerRegistry({ DISCORD: installer }),
    handoff,
  );
  return { installer, handoff, useCase };
}

describe('beginning to connect a chat tool', () => {
  it('answers where to send the Admin, carrying the state this install is recognised by', async () => {
    const { handoff, useCase } = setUp();

    const { authorizeUrl } = await useCase.execute(beginning());

    expect(authorizeUrl).toContain(
      handoff.signInstallStart({
        accountId: ANN,
        workspaceId: WORKSPACE_ID,
        provider: 'DISCORD',
      }),
    );
  });

  it('refuses a Member who is not an Admin', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute(beginning({ isAdmin: false })),
    ).rejects.toBeInstanceOf(NotAllowedToManageIntegrationsError);
  });

  it('refuses a chat tool Thrive does not connect to, rather than reading as a wrong address', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute(beginning({ provider: 'TEAMS' })),
    ).rejects.toBeInstanceOf(ProviderNotSupportedError);
  });
});
