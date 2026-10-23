import { describe, expect, it } from 'bun:test';
import {
  FakeChatInstaller,
  FakeConnectionQuery,
  FakeConnectionRepository,
} from '@test/support/integrations.fakes';
import { ProviderNotSupportedError } from '../../domain/integrations.errors';
import {
  ConnectionNotFoundError,
  NotAllowedToManageIntegrationsError,
} from '../integrations.errors';
import { ChatInstallerRegistry } from '../service/chat-installer-registry.service';
import {
  type DisconnectIntegrationInput,
  DisconnectIntegrationUseCase,
} from './disconnect-integration.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const GUILD_ID = 'guild-acme';

function setUp() {
  const installer = new FakeChatInstaller();
  const connectionQuery = new FakeConnectionQuery().connectedTo(GUILD_ID);
  const connectionRepository = new FakeConnectionRepository();
  connectionRepository.saved.push({
    id: 'connection-1',
    workspaceId: WORKSPACE_ID,
    provider: 'DISCORD',
    externalWorkspaceId: GUILD_ID,
    externalWorkspaceName: 'Acme HQ',
    externalChannelId: 'channel-general',
    externalChannelName: 'general',
    connectedByAccountId: 'account-ann',
  });
  const useCase = new DisconnectIntegrationUseCase(
    new ChatInstallerRegistry({ DISCORD: installer }),
    connectionQuery,
    connectionRepository,
  );
  const disconnecting = (
    overrides: Partial<DisconnectIntegrationInput> = {},
  ): DisconnectIntegrationInput => ({
    workspaceId: WORKSPACE_ID,
    provider: 'DISCORD',
    isAdmin: true,
    ...overrides,
  });
  return {
    installer,
    connectionQuery,
    connectionRepository,
    useCase,
    disconnecting,
  };
}

describe('disconnecting a chat tool', () => {
  it('leaves the space, so the bot does not sit in a server it no longer serves', async () => {
    const { installer, useCase, disconnecting } = setUp();

    await useCase.execute(disconnecting());

    expect(installer.left).toEqual([GUILD_ID]);
  });

  it('forgets the Connection, so connecting again has to be authorised again', async () => {
    const { connectionRepository, useCase, disconnecting } = setUp();

    await useCase.execute(disconnecting());

    expect(connectionRepository.saved).toEqual([]);
  });

  it('forgets it even when the tool will not let go, so nobody is stuck with a Connection they disowned', async () => {
    const { installer, connectionRepository, useCase, disconnecting } = setUp();
    installer.refusing('leave');

    await useCase.execute(disconnecting());

    expect(installer.left).toEqual([GUILD_ID]);
    expect(connectionRepository.saved).toEqual([]);
  });

  it('says so when there is nothing connected, rather than reporting success', async () => {
    const { installer, disconnecting } = setUp();
    const nothingConnected = new DisconnectIntegrationUseCase(
      new ChatInstallerRegistry({ DISCORD: installer }),
      new FakeConnectionQuery(),
      new FakeConnectionRepository(),
    );

    await expect(
      nothingConnected.execute(disconnecting()),
    ).rejects.toBeInstanceOf(ConnectionNotFoundError);
    expect(installer.left).toEqual([]);
  });

  it('refuses a Member who is not an Admin before the tool is called at all', async () => {
    const { installer, connectionRepository, useCase, disconnecting } = setUp();

    await expect(
      useCase.execute(disconnecting({ isAdmin: false })),
    ).rejects.toBeInstanceOf(NotAllowedToManageIntegrationsError);
    expect(installer.left).toEqual([]);
    expect(connectionRepository.saved).toHaveLength(1);
  });

  it('refuses a chat tool Thrive does not connect to', async () => {
    const { useCase, disconnecting } = setUp();

    await expect(
      useCase.execute(disconnecting({ provider: 'TEAMS' })),
    ).rejects.toBeInstanceOf(ProviderNotSupportedError);
  });
});
