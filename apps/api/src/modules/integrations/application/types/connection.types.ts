import type { IntegrationProviderValue } from '../../domain/value-object/integration-provider.vo';

/**
 * One Workspace's Connection, as its Settings screen reads it. The provider's own ids are left
 * out: nothing on screen needs them, and the names are what a person recognises.
 */
export interface ConnectionView {
  readonly provider: IntegrationProviderValue;
  /** The chat tool's own name for the space — a Discord server, a Slack team. */
  readonly externalWorkspaceName: string;
  readonly externalChannelName: string;
  /** The Account of the Admin who connected it. The screen puts a name to it. */
  readonly connectedByAccountId: string;
  readonly connectedAt: Date;
}

export interface PageRequest {
  /** 1-based. */
  readonly page: number;
  readonly pageSize: number;
}

export interface ConnectionPage {
  readonly items: readonly ConnectionView[];
  readonly total: number;
}

/** What a call to the tool needs to act on a Workspace's Connection. */
export interface ConnectedSpace {
  readonly externalWorkspaceId: string;
}

/** One channel the chat tool offered, for the Admin to choose between. */
export interface OfferedChannel {
  readonly id: string;
  readonly name: string;
}
