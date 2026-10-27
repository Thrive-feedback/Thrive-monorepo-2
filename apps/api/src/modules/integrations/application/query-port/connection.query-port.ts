import type { IntegrationProviderValue } from '../../domain/value-object/integration-provider.vo';
import type {
  ConnectedSpace,
  ConnectionPage,
  PageRequest,
  PostableChannel,
} from '../types/connection.types';

export abstract class ConnectionQuery {
  /**
   * The Workspace's Connections, oldest first. At most one per chat tool, so today at most one
   * altogether — a list because a second tool is expected, not because this one is long.
   */
  abstract connectionsOfWorkspace(
    workspaceId: string,
    page: PageRequest,
  ): Promise<ConnectionPage>;

  /**
   * The provider's own ids for one Workspace's Connection, or `null` when it has none to that
   * tool. Kept apart from the view the screen reads: these are what a call to the tool needs,
   * and nothing on screen needs them.
   */
  abstract connectedSpace(
    workspaceId: string,
    provider: IntegrationProviderValue,
  ): Promise<ConnectedSpace | null>;

  /**
   * Every channel this Workspace has connected, for announcing something that happened in the
   * open. Empty when it has connected nothing, which is the ordinary case and not a refusal.
   *
   * Kept apart from `connectedSpace`, which names one tool because its caller is acting on that
   * tool's Connection; an announcement does not know or care which tools exist.
   */
  abstract postableChannelsOf(
    workspaceId: string,
  ): Promise<readonly PostableChannel[]>;
}
