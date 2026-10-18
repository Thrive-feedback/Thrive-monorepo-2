import { ChatPoster } from '@app/shared/application/chat-poster.port';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { Injectable } from '@nestjs/common';
import { ConnectionRepository } from '../../domain/repository/connection-repository.port';
import { IntegrationProvider } from '../../domain/value-object/integration-provider.vo';
import {
  ChannelNotOfferedError,
  ChannelUnreachableError,
  InstallRefusedError,
  InstallStateInvalidError,
  NotAllowedToManageIntegrationsError,
} from '../integrations.errors';
import { InstallHandoff } from '../port/install-handoff.port';
import { ChatInstallerRegistry } from '../service/chat-installer-registry.service';

/**
 * What the channel is told once, when it is connected. It says what will arrive later, because
 * the next thing to appear there is somebody's Feedback and a team should know why.
 */
const TEST_MESSAGE =
  'Thrive is connected to this channel. Feedback that somebody chooses to show the whole Workspace will appear here, with a link — never the words of the Feedback itself.';

export interface ChooseChannelInput {
  readonly workspaceId: string;
  readonly accountId: string;
  readonly provider: string;
  readonly isAdmin: boolean;
  /** The signed space `CompleteInstall` answered with. */
  readonly installation: string;
  readonly channelId: string;
}

/**
 * Stores the Workspace's Connection — but only after a message has actually arrived in the
 * channel chosen (#199 AC 4), so a Connection that has never worked cannot exist for #200 and
 * #201 to special-case.
 *
 * No transaction: one row, one statement. Holding one open across two calls to a chat tool
 * would keep a database connection for as long as the tool takes to answer (design 0020 D10).
 */
@Injectable()
export class ChooseChannelUseCase {
  constructor(
    private readonly chatInstallerRegistry: ChatInstallerRegistry,
    private readonly installHandoff: InstallHandoff,
    private readonly chatPoster: ChatPoster,
    private readonly connectionRepository: ConnectionRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: ChooseChannelInput): Promise<void> {
    if (!input.isAdmin) {
      throw new NotAllowedToManageIntegrationsError();
    }
    const provider = IntegrationProvider.of(input.provider).toString();
    const install = this.installHandoff.readAuthorizedInstall(
      input.installation,
    );
    if (
      !install ||
      install.accountId !== input.accountId ||
      install.workspaceId !== input.workspaceId ||
      install.provider !== provider
    ) {
      throw new InstallStateInvalidError();
    }

    // Asked again rather than remembered from the previous request: the channel has to be one
    // of this space's, and the tool is the only thing that knows which those are. Without it an
    // Admin of one Workspace could name a channel in another Workspace's server.
    const channels = await this.chatInstallerRegistry
      .for(provider)
      .listChannels(install.externalWorkspaceId)
      .catch(() => Promise.reject(new InstallRefusedError()));
    const chosen = channels.find((channel) => channel.id === input.channelId);
    if (!chosen) {
      throw new ChannelNotOfferedError();
    }

    await this.chatPoster
      .postToChannel({
        provider,
        channelId: chosen.id,
        text: TEST_MESSAGE,
      })
      .catch(() => Promise.reject(new ChannelUnreachableError()));

    await this.connectionRepository.save({
      id: this.idGenerator.next(),
      workspaceId: input.workspaceId,
      provider,
      externalWorkspaceId: install.externalWorkspaceId,
      externalWorkspaceName: install.externalWorkspaceName,
      externalChannelId: chosen.id,
      externalChannelName: chosen.name,
      connectedByAccountId: input.accountId,
    });
  }
}
