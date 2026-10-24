import { Injectable } from '@nestjs/common';
import { NotificationQuery } from '../query-port/notification.query-port';

export interface CountMyUnreadInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose bell to count: the signed-in caller, always. Never taken from the request. */
  readonly recipientAccountId: string;
}

/**
 * A query: how many things the caller has been told about here and not yet read.
 *
 * This is the one read the bell makes on a timer, so it is the hottest query in the feature and
 * the reason the table carries an index over recipient, Workspace and read state. It answers a
 * number rather than the rows, because a number is all a badge draws and counting on an index
 * never touches the rows at all.
 */
@Injectable()
export class CountMyUnreadUseCase {
  constructor(private readonly notificationQuery: NotificationQuery) {}

  async execute(input: CountMyUnreadInput): Promise<number> {
    return this.notificationQuery.unreadCountFor(
      input.workspaceId,
      input.recipientAccountId,
    );
  }
}
