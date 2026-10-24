import { Clock } from '@app/shared/application/clock.port';
import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../../domain/repository/notification-repository.port';
import { NotificationNotFoundError } from '../notifications.errors';

export interface MarkNotificationReadInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose Notification it must be: the signed-in caller, always. */
  readonly recipientAccountId: string;
  readonly notificationId: string;
}

/**
 * Marks one thing the caller was told about as read, which is what takes it out of their count.
 *
 * An id belonging to somebody else is refused as not found rather than as forbidden. Saying
 * "that is not yours" would confirm the row exists, and a Notification's existence is itself the
 * fact worth keeping: it says a named person was asked, answered or written to. So the two are
 * one answer, and the refusal is the store's — the recipient is part of the match, not a check
 * run after a row has been loaded.
 *
 * Marking one that is already read is not a failure, because the Member asked for a state it is
 * already in and got it. Opening the same line twice stamps it again and says nothing.
 */
@Injectable()
export class MarkNotificationReadUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: MarkNotificationReadInput): Promise<void> {
    const marked = await this.notificationRepository.markRead(
      {
        notificationId: input.notificationId,
        workspaceId: input.workspaceId,
        recipientAccountId: input.recipientAccountId,
      },
      this.clock.now(),
    );
    if (!marked) {
      throw new NotificationNotFoundError();
    }
  }
}
