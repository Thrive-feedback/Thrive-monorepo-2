import { Clock } from '@app/shared/application/clock.port';
import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../../domain/repository/notification-repository.port';

export interface MarkAllReadInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose bell to clear: the signed-in caller, always. */
  readonly recipientAccountId: string;
}

/**
 * Clears the caller's bell in this Workspace: everything they have been told here and not read
 * becomes read, in one statement.
 *
 * Only this Workspace. A Member of several has a bell per Workspace (`requirement.md` rule 5),
 * and clearing the one they are looking at may not quietly clear the others — somebody who
 * switches Workspace would otherwise find things they never saw already marked as seen.
 *
 * An empty bell is not a failure: the button answers the same whether it cleared ten lines or
 * none, because the Member asked for a state and ended in it either way.
 */
@Injectable()
export class MarkAllReadUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: MarkAllReadInput): Promise<void> {
    await this.notificationRepository.markAllRead(
      {
        workspaceId: input.workspaceId,
        recipientAccountId: input.recipientAccountId,
      },
      this.clock.now(),
    );
  }
}
