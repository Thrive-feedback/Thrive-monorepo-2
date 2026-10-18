import { Injectable } from '@nestjs/common';
import { IntegrationProvider } from '../../domain/value-object/integration-provider.vo';
import { NotAllowedToManageIntegrationsError } from '../integrations.errors';
import { InstallHandoff } from '../port/install-handoff.port';
import { ChatInstallerRegistry } from '../service/chat-installer-registry.service';

export interface BeginInstallInput {
  readonly workspaceId: string;
  readonly accountId: string;
  /** Straight from the path, so it is checked here rather than trusted. */
  readonly provider: string;
  /** Whether the caller is an Admin of that Workspace, resolved by the guard. */
  readonly isAdmin: boolean;
}

export interface BeginInstallResult {
  readonly authorizeUrl: string;
}

/**
 * Answers where to send an Admin to authorise Thrive in their chat tool, with a signed `state`
 * that the return is checked against.
 *
 * The Role is decided here rather than in the guard, as Workspace's own routes do: the guard
 * proves the caller belongs to the Workspace, and refusing a Member who is not an Admin is a
 * rule of this workflow. Nothing reaches the chat tool before that refusal.
 */
@Injectable()
export class BeginInstallUseCase {
  constructor(
    private readonly chatInstallerRegistry: ChatInstallerRegistry,
    private readonly installHandoff: InstallHandoff,
  ) {}

  async execute(input: BeginInstallInput): Promise<BeginInstallResult> {
    if (!input.isAdmin) {
      throw new NotAllowedToManageIntegrationsError();
    }
    const provider = IntegrationProvider.of(input.provider).toString();
    const state = this.installHandoff.signInstallStart({
      accountId: input.accountId,
      workspaceId: input.workspaceId,
      provider,
    });
    return {
      authorizeUrl: this.chatInstallerRegistry
        .for(provider)
        .authorizeUrl(state),
    };
  }
}
