import type { ConnectionPage, PageRequest } from '../types/connection.types';

export abstract class ConnectionQuery {
  /**
   * The Workspace's Connections, oldest first. At most one per chat tool, so today at most one
   * altogether — a list because a second tool is expected, not because this one is long.
   */
  abstract connectionsOfWorkspace(
    workspaceId: string,
    page: PageRequest,
  ): Promise<ConnectionPage>;
}
