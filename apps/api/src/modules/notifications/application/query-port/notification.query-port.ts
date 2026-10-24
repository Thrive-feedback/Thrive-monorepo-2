import type {
  NotificationRowPage,
  PageRequest,
} from '../types/notification.types';

/**
 * Reading Notifications for the bell, outside the repository because it answers a view rather
 * than an entity (`BE_05`). Both methods take the recipient as an argument rather than filtering
 * by one afterwards, and neither has a shape that could name somebody else — so "nobody sees
 * anybody else's" holds without a check anyone has to remember (design 0022 D11).
 */
export abstract class NotificationQuery {
  /** One page of the recipient's own Notifications in this Workspace, newest first. */
  abstract forRecipient(
    workspaceId: string,
    recipientAccountId: string,
    page: PageRequest,
  ): Promise<NotificationRowPage>;

  /**
   * How many of theirs here they have not read. The one query that runs on every poll of the
   * bell, which is why the table carries an index covering exactly these three columns.
   */
  abstract unreadCountFor(
    workspaceId: string,
    recipientAccountId: string,
  ): Promise<number>;
}
