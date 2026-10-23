import { Injectable, Logger } from '@nestjs/common';
import { ConnectionRepository } from '../../domain/repository/connection-repository.port';
import { IntegrationProvider } from '../../domain/value-object/integration-provider.vo';
import {
  ConnectionNotFoundError,
  NotAllowedToManageIntegrationsError,
} from '../integrations.errors';
import { ConnectionQuery } from '../query-port/connection.query-port';
import { ChatInstallerRegistry } from '../service/chat-installer-registry.service';

export interface DisconnectIntegrationInput {
  readonly workspaceId: string;
  readonly provider: string;
  /** Whether the caller is an Admin of that Workspace, resolved by the guard. */
  readonly isAdmin: boolean;
}

/**
 * Ends a Workspace's Connection to one chat tool: Thrive leaves the space and forgets what it
 * knew, so connecting again has to be authorised again (#200).
 *
 * The Connection is forgotten **whether or not the tool agreed to let go**. A Workspace that
 * removed the bot by hand, or a tool that is simply unreachable, must still be able to
 * disconnect — the alternative is a Workspace stuck with a Connection it has already disowned.
 * The reverse order would be worse: leaving first and failing to forget would leave a Connection
 * that posts nowhere.
 */
@Injectable()
export class DisconnectIntegrationUseCase {
  private readonly logger = new Logger(DisconnectIntegrationUseCase.name);

  constructor(
    private readonly chatInstallerRegistry: ChatInstallerRegistry,
    private readonly connectionQuery: ConnectionQuery,
    private readonly connectionRepository: ConnectionRepository,
  ) {}

  async execute(input: DisconnectIntegrationInput): Promise<void> {
    if (!input.isAdmin) {
      throw new NotAllowedToManageIntegrationsError();
    }
    const provider = IntegrationProvider.of(input.provider).toString();
    const space = await this.connectionQuery.connectedSpace(
      input.workspaceId,
      provider,
    );
    if (!space) {
      throw new ConnectionNotFoundError();
    }

    await this.chatInstallerRegistry
      .for(provider)
      .leave(space.externalWorkspaceId)
      .catch((error: unknown) => {
        // Said once, for us. The person asked to disconnect and that is what happens; a bot
        // left behind in a server somebody has already disowned is ours to notice, not theirs.
        this.logger.warn({
          event: 'integration.leave_failed',
          provider,
          workspaceId: input.workspaceId,
          reason: error instanceof Error ? error.message : 'unknown',
        });
      });

    await this.connectionRepository.remove({
      workspaceId: input.workspaceId,
      provider,
    });
  }
}
