import { Injectable } from '@nestjs/common';
import { IntegrationProvider } from '../../domain/value-object/integration-provider.vo';
import {
  InstallRefusedError,
  InstallStateInvalidError,
  NotAllowedToManageIntegrationsError,
} from '../integrations.errors';
import { InstallHandoff } from '../port/install-handoff.port';
import { ChatInstallerRegistry } from '../service/chat-installer-registry.service';
import type { OfferedChannel } from '../types/connection.types';

export interface CompleteInstallInput {
  readonly workspaceId: string;
  readonly accountId: string;
  readonly provider: string;
  readonly isAdmin: boolean;
  /** The authorisation code the chat tool sent the browser back with. */
  readonly code: string;
  /** The `state` this install started with, as `BeginInstall` signed it. */
  readonly state: string;
}

export interface CompleteInstallResult {
  /** The chat tool's own name for the space, to show while a channel is chosen. */
  readonly externalWorkspaceName: string;
  readonly channels: readonly OfferedChannel[];
  /**
   * Which space was authorised, signed, for the Admin's next request to carry back. It exists
   * because nothing is stored until a message has arrived in the chosen channel, and the
   * alternative — reading the space from the next request body — would let an Admin name a
   * server nobody authorised.
   */
  readonly installation: string;
}

/**
 * Finishes the round trip: checks the install started here, asks the chat tool what was
 * authorised, and offers the channels of that space.
 *
 * Nothing is stored. A Connection exists only once a message has reached the channel somebody
 * chose (design 0020 §4.3), so an install abandoned at this point leaves nothing behind.
 */
@Injectable()
export class CompleteInstallUseCase {
  constructor(
    private readonly chatInstallerRegistry: ChatInstallerRegistry,
    private readonly installHandoff: InstallHandoff,
  ) {}

  async execute(input: CompleteInstallInput): Promise<CompleteInstallResult> {
    if (!input.isAdmin) {
      throw new NotAllowedToManageIntegrationsError();
    }
    const provider = IntegrationProvider.of(input.provider).toString();
    const start = this.installHandoff.readInstallStart(input.state);
    if (
      !start ||
      start.accountId !== input.accountId ||
      start.workspaceId !== input.workspaceId ||
      start.provider !== provider
    ) {
      throw new InstallStateInvalidError();
    }

    const installer = this.chatInstallerRegistry.for(provider);
    // The chat tool's own answer is the only authenticated proof of which space was
    // authorised, so a refusal here ends the install rather than falling back on anything the
    // browser carried (design 0020 D6).
    const space = await installer
      .exchangeCode(input.code)
      .catch(() => Promise.reject(new InstallRefusedError()));
    const channels = await installer
      .listChannels(space.externalWorkspaceId)
      .catch(() => Promise.reject(new InstallRefusedError()));

    return {
      externalWorkspaceName: space.externalWorkspaceName,
      channels,
      installation: this.installHandoff.signAuthorizedInstall({
        accountId: input.accountId,
        workspaceId: input.workspaceId,
        provider,
        externalWorkspaceId: space.externalWorkspaceId,
        externalWorkspaceName: space.externalWorkspaceName,
      }),
    };
  }
}
