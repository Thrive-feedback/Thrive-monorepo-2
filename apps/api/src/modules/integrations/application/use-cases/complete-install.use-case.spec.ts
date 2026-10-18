import { describe, expect, it } from 'bun:test';
import {
  FakeChatInstaller,
  FakeInstallHandoff,
} from '@test/support/integrations.fakes';
import {
  InstallRefusedError,
  InstallStateInvalidError,
  NotAllowedToManageIntegrationsError,
} from '../integrations.errors';
import { ChatInstallerRegistry } from '../service/chat-installer-registry.service';
import {
  type CompleteInstallInput,
  CompleteInstallUseCase,
} from './complete-install.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const ANN = 'account-ann';
const BEN = 'account-ben';

function setUp() {
  const installer = new FakeChatInstaller();
  const handoff = new FakeInstallHandoff();
  const useCase = new CompleteInstallUseCase(
    new ChatInstallerRegistry({ DISCORD: installer }),
    handoff,
  );
  const completing = (
    overrides: Partial<CompleteInstallInput> = {},
  ): CompleteInstallInput => ({
    workspaceId: WORKSPACE_ID,
    accountId: ANN,
    provider: 'DISCORD',
    isAdmin: true,
    code: 'a-code',
    state: handoff.signInstallStart({
      accountId: ANN,
      workspaceId: WORKSPACE_ID,
      provider: 'DISCORD',
    }),
    ...overrides,
  });
  return { installer, handoff, useCase, completing };
}

describe('finishing an authorisation', () => {
  it('names the server the tool itself reported, and offers its channels', async () => {
    const { installer, useCase, completing } = setUp();
    installer
      .withSpace({
        externalWorkspaceId: 'guild-acme',
        externalWorkspaceName: 'Acme HQ',
      })
      .withChannels(
        { id: 'channel-general', name: 'general' },
        { id: 'channel-standups', name: 'standups' },
      );

    const install = await useCase.execute(completing());

    expect(install.externalWorkspaceName).toBe('Acme HQ');
    expect(install.channels).toEqual([
      { id: 'channel-general', name: 'general' },
      { id: 'channel-standups', name: 'standups' },
    ]);
    // The channels are read for the space the exchange named, never one from the request.
    expect(installer.listedSpaces).toEqual(['guild-acme']);
  });

  it('hands back a signed statement of which server was authorised', async () => {
    const { handoff, useCase, completing } = setUp();

    const install = await useCase.execute(completing());

    expect(handoff.readAuthorizedInstall(install.installation)).toEqual({
      accountId: ANN,
      workspaceId: WORKSPACE_ID,
      provider: 'DISCORD',
      externalWorkspaceId: 'guild-acme',
      externalWorkspaceName: 'Acme HQ',
    });
  });

  it('refuses a return whose state Thrive did not sign, or which has gone stale', async () => {
    const { installer, handoff, useCase, completing } = setUp();
    handoff.treatingEverythingAsStale();

    await expect(useCase.execute(completing())).rejects.toBeInstanceOf(
      InstallStateInvalidError,
    );
    expect(installer.exchangedCodes).toEqual([]);
  });

  it('refuses a state issued for another Account', async () => {
    const { installer, handoff, useCase, completing } = setUp();
    const theirs = handoff.signInstallStart({
      accountId: BEN,
      workspaceId: WORKSPACE_ID,
      provider: 'DISCORD',
    });

    await expect(
      useCase.execute(completing({ state: theirs })),
    ).rejects.toBeInstanceOf(InstallStateInvalidError);
    expect(installer.exchangedCodes).toEqual([]);
  });

  it('refuses a state issued for another Workspace', async () => {
    const { installer, handoff, useCase, completing } = setUp();
    const elsewhere = handoff.signInstallStart({
      accountId: ANN,
      workspaceId: OTHER_WORKSPACE_ID,
      provider: 'DISCORD',
    });

    await expect(
      useCase.execute(completing({ state: elsewhere })),
    ).rejects.toBeInstanceOf(InstallStateInvalidError);
    expect(installer.exchangedCodes).toEqual([]);
  });

  it('refuses when the tool rejects the exchange, since nothing proves what was authorised', async () => {
    const { installer, useCase, completing } = setUp();
    installer.refusing('exchange');

    await expect(useCase.execute(completing())).rejects.toBeInstanceOf(
      InstallRefusedError,
    );
  });

  it('refuses when the tool will not list the channels', async () => {
    const { installer, useCase, completing } = setUp();
    installer.refusing('channels');

    await expect(useCase.execute(completing())).rejects.toBeInstanceOf(
      InstallRefusedError,
    );
  });

  it('refuses a Member who is not an Admin before the tool is called at all', async () => {
    const { installer, useCase, completing } = setUp();

    await expect(
      useCase.execute(completing({ isAdmin: false })),
    ).rejects.toBeInstanceOf(NotAllowedToManageIntegrationsError);
    expect(installer.exchangedCodes).toEqual([]);
  });
});
