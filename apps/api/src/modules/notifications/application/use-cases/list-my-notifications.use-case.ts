import { AccountSummaryPort } from '@app/modules/identity';
import { Injectable } from '@nestjs/common';
import { NotificationQuery } from '../query-port/notification.query-port';
import type {
  NotificationListView,
  PageRequest,
} from '../types/notification.types';

export interface ListMyNotificationsInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose bell to read: the signed-in caller, always. Never taken from the request. */
  readonly recipientAccountId: string;
  readonly page: PageRequest;
}

/**
 * A query: what the caller has been told in this Workspace, newest first, with each actor named.
 *
 * The recipient is an argument to the read rather than a filter applied after it, so a version
 * of this that lists somebody else's bell cannot be written by accident — which is the whole
 * authorization rule here (`BE_21` R4, design 0022 D11).
 *
 * The names are resolved now rather than stored when the row was written: a stored sentence
 * would be a second copy of words Thrive keeps in one place, and it would freeze a name that may
 * change (design 0022 D3). One call names the whole page, so the cost does not grow with the
 * number of lines (`BE_06` R9). Nothing is read from Feedback: `subjectId` goes out raw and the
 * web turns it into a link, because reading what a Notification points at would make this module
 * depend on the one that calls it.
 */
@Injectable()
export class ListMyNotificationsUseCase {
  constructor(
    private readonly notificationQuery: NotificationQuery,
    private readonly accountSummaryPort: AccountSummaryPort,
  ) {}

  async execute(
    input: ListMyNotificationsInput,
  ): Promise<NotificationListView> {
    const page = await this.notificationQuery.forRecipient(
      input.workspaceId,
      input.recipientAccountId,
      input.page,
    );
    const actorIds = [
      ...new Set(page.items.map((notification) => notification.actorAccountId)),
    ];
    const summaries = await this.accountSummaryPort.summariesOf(actorIds);
    // **Display name, not full name.** The glossary calls it "the name others see and call them
    // by", and a bell line is somebody being called by name — "Nut asked you for feedback". It
    // also keeps the bell and the chat message saying the same thing: `ChatCopyService` composes
    // from Identity's `ProfileNamePort.displayNameOf`.
    const names = new Map(
      summaries.map((summary) => [summary.accountId, summary.displayName]),
    );

    return {
      items: page.items.map((notification) => ({
        id: notification.id,
        type: notification.type,
        actorAccountId: notification.actorAccountId,
        // An actor who has not introduced themselves and one whose Account has gone both read
        // as unnamed, because neither has a name to show and the bell says the same of both.
        actorName: names.get(notification.actorAccountId) ?? null,
        subjectId: notification.subjectId,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
      })),
      total: page.total,
    };
  }
}
