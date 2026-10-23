import type { IntegrationProviderValue } from '../value-object/integration-provider.vo';

/**
 * A Workspace's link to one chat tool and the one channel it posts in, as it is stored. Only
 * identifiers and names: nothing here is a credential, because Discord issues none per
 * Workspace, and the first provider that does brings its own column and cipher with it
 * (design 0020 D3).
 */
export interface ConnectionToStore {
  /** Minted by the use case, so a Connection carries its identity before it is stored. */
  readonly id: string;
  readonly workspaceId: string;
  readonly provider: IntegrationProviderValue;
  readonly externalWorkspaceId: string;
  readonly externalWorkspaceName: string;
  readonly externalChannelId: string;
  readonly externalChannelName: string;
  readonly connectedByAccountId: string;
}

export abstract class ConnectionRepository {
  /**
   * Stores the Workspace's Connection to that tool, replacing the one it had: a Workspace has
   * one Connection per tool, and connecting again is how it is changed. The replacement keeps
   * the row's id, so nothing that later names a Connection is invalidated by a reconnection.
   */
  abstract save(connection: ConnectionToStore): Promise<void>;

  /**
   * Forgets the Workspace's Connection to that tool. Deleted rather than marked unused: what is
   * stored is an authorisation somebody gave, so connecting again has to be authorised again
   * (#200). Answers whether there was one to forget.
   */
  abstract remove(connection: {
    readonly workspaceId: string;
    readonly provider: IntegrationProviderValue;
  }): Promise<boolean>;
}
