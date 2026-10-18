import { Injectable } from '@nestjs/common';
import { ConnectionQuery } from '../query-port/connection.query-port';
import type { ConnectionPage, PageRequest } from '../types/connection.types';

export interface ListConnectionsInput {
  readonly workspaceId: string;
  readonly page: PageRequest;
}

/**
 * The Workspace's Connections, for its Settings screen. Open to any Member, not only an Admin:
 * the channel's name is not a secret, and a Member being able to see that their Workspace posts
 * into `#general` is the honest half of the audience risk brain `ADR-0035` records.
 */
@Injectable()
export class ListConnectionsUseCase {
  constructor(private readonly connectionQuery: ConnectionQuery) {}

  async execute(input: ListConnectionsInput): Promise<ConnectionPage> {
    return this.connectionQuery.connectionsOfWorkspace(
      input.workspaceId,
      input.page,
    );
  }
}
