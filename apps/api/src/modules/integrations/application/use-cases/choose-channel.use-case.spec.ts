import { describe, expect, it } from 'bun:test';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import {
  FakeChatInstaller,
  FakeChatPoster,
  FakeConnectionRepository,
  FakeInstallHandoff,
} from '@test/support/integrations.fakes';
import {
  ChannelNotOfferedError,
  ChannelUnreachableError,
  InstallRefusedError,
  InstallStateInvalidError,
  NotAllowedToManageIntegrationsError,
} from '../integrations.errors';
import { ChatInstallerRegistry } from '../service/chat-installer-registry.service';
import {
  type ChooseChannelInput,
  ChooseChannelUseCase,
} from './choose-channel.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const CONNECTION_ID = '0199a0f0-0000-7000-8000-0000000000c1';
const ANN = 'account-ann';

function setUp() {
  const installer = new FakeChatInstaller().withChannels(
    { id: 'channel-general', name: 'general' },
    { id: 'channel-standups', name: 'standups' },
  );
  const handoff = new FakeInstallHandoff();
  const chatPoster = new FakeChatPoster();
  const connectionRepository = new FakeConnectionRepository();
  const useCase = new ChooseChannelUseCase(
    new ChatInstallerRegistry({ DISCORD: installer }),
    handoff,
    chatPoster,
    connectionRepository,
    new FakeIdGenerator(CONNECTION_ID),
  );
  const choosing = (
    overrides: Partial<ChooseChannelInput> = {},
  ): ChooseChannelInput => ({
    workspaceId: WORKSPACE_ID,
    accountId: ANN,
    provider: 'DISCORD',
    isAdmin: true,
    installation: handoff.signAuthorizedInstall({
      accountId: ANN,
      workspaceId: WORKSPACE_ID,
      provider: 'DISCORD',
      externalWorkspaceId: 'guild-acme',
      externalWorkspaceName: 'Acme HQ',
    }),
    channelId: 'channel-standups',
    ...overrides,
  });
  return {
    installer,
    handoff,
    chatPoster,
    connectionRepository,
    useCase,
    choosing,
  };
}

describe('choosing the channel a Workspace posts in', () => {
  it('stores the Connection with the server and channel by name', async () => {
    const { connectionRepository, useCase, choosing } = setUp();

    await useCase.execute(choosing());

    expect(connectionRepository.saved).toEqual([
      {
        id: CONNECTION_ID,
        workspaceId: WORKSPACE_ID,
        provider: 'DISCORD',
        externalWorkspaceId: 'guild-acme',
        externalWorkspaceName: 'Acme HQ',
        externalChannelId: 'channel-standups',
        externalChannelName: 'standups',
        connectedByAccountId: ANN,
      },
    ]);
  });

  it('posts one message into the channel before anything is stored', async () => {
    const { chatPoster, useCase, choosing } = setUp();

    await useCase.execute(choosing());

    expect(chatPoster.posts).toHaveLength(1);
    expect(chatPoster.posts[0]?.provider).toBe('DISCORD');
    expect(chatPoster.posts[0]?.channelId).toBe('channel-standups');
  });

  it('stores nothing when the message does not arrive, so a Connection that never worked cannot exist', async () => {
    const { chatPoster, connectionRepository, useCase, choosing } = setUp();
    chatPoster.unreachableChannel();

    await expect(useCase.execute(choosing())).rejects.toBeInstanceOf(
      ChannelUnreachableError,
    );
    expect(connectionRepository.saved).toEqual([]);
  });

  it('refuses a channel that is not one the tool offered for that server', async () => {
    const { chatPoster, connectionRepository, useCase, choosing } = setUp();

    await expect(
      useCase.execute(choosing({ channelId: 'channel-in-another-server' })),
    ).rejects.toBeInstanceOf(ChannelNotOfferedError);
    expect(chatPoster.posts).toEqual([]);
    expect(connectionRepository.saved).toEqual([]);
  });

  it('asks the tool again which channels that server has, rather than trusting the request', async () => {
    const { installer, useCase, choosing } = setUp();

    await useCase.execute(choosing());

    expect(installer.listedSpaces).toEqual(['guild-acme']);
  });

  it('refuses when the tool will not say which channels that server has, storing nothing', async () => {
    const { installer, chatPoster, connectionRepository, useCase, choosing } =
      setUp();
    installer.refusing('channels');

    await expect(useCase.execute(choosing())).rejects.toBeInstanceOf(
      InstallRefusedError,
    );
    expect(chatPoster.posts).toEqual([]);
    expect(connectionRepository.saved).toEqual([]);
  });

  it('refuses an installation statement Thrive did not sign, or which has gone stale', async () => {
    const { handoff, connectionRepository, useCase, choosing } = setUp();
    handoff.treatingEverythingAsStale();

    await expect(useCase.execute(choosing())).rejects.toBeInstanceOf(
      InstallStateInvalidError,
    );
    expect(connectionRepository.saved).toEqual([]);
  });

  it('refuses an installation authorised for another Workspace', async () => {
    const { handoff, connectionRepository, useCase, choosing } = setUp();
    const elsewhere = handoff.signAuthorizedInstall({
      accountId: ANN,
      workspaceId: OTHER_WORKSPACE_ID,
      provider: 'DISCORD',
      externalWorkspaceId: 'guild-globex',
      externalWorkspaceName: 'Globex',
    });

    await expect(
      useCase.execute(choosing({ installation: elsewhere })),
    ).rejects.toBeInstanceOf(InstallStateInvalidError);
    expect(connectionRepository.saved).toEqual([]);
  });

  it('refuses a Member who is not an Admin before the tool is called at all', async () => {
    const { installer, chatPoster, connectionRepository, useCase, choosing } =
      setUp();

    await expect(
      useCase.execute(choosing({ isAdmin: false })),
    ).rejects.toBeInstanceOf(NotAllowedToManageIntegrationsError);
    expect(installer.listedSpaces).toEqual([]);
    expect(chatPoster.posts).toEqual([]);
    expect(connectionRepository.saved).toEqual([]);
  });
});
