import { Injectable } from '@nestjs/common';
import {
  MyCountsQuery,
  type MyCountsRow,
} from '../query-port/my-counts.query-port';

export interface GetMyCountsInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose counts to read: the signed-in caller, always. Never read from the request. */
  readonly accountId: string;
}

/**
 * A query: the numbers beside Waiting for me and each kind of Received, read from the Asks,
 * Feedback and Kudos themselves rather than from the bell. Reading a Notification therefore leaves
 * them as they were: an Ask still waits until it is answered, and what is new stays new until its
 * kind of Received is opened (ADR 0091).
 *
 * The web asks for this on the same timer as the bell, so it answers numbers and nothing else.
 */
@Injectable()
export class GetMyCountsUseCase {
  constructor(private readonly myCountsQuery: MyCountsQuery) {}

  execute(input: GetMyCountsInput): Promise<MyCountsRow> {
    return this.myCountsQuery.countsFor(input.workspaceId, input.accountId);
  }
}
