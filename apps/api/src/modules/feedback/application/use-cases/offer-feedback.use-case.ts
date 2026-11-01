import { FEEDBACK_PUBLISHED_TYPE } from '@app/modules/integrations';
import { FEEDBACK_WRITTEN_TYPE } from '@app/modules/notifications';
import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { Outbox } from '@app/shared/application/outbox.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { Feedback } from '../../domain/entity/feedback.entity';
import { FeedbackRepository } from '../../domain/repository/feedback-repository.port';
import { FeedbackMessage } from '../../domain/value-object/feedback-message.vo';
import {
  Postcard,
  type PostcardSnapshot,
} from '../../domain/value-object/postcard.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import {
  ReceiverNotInWorkspaceError,
  SelectedPersonNotInWorkspaceError,
} from '../feedback-request.errors';
import { TagsService } from '../service/tags.service';

export interface OfferFeedbackInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. Never read from the body. */
  readonly giverAccountId: string;
  /** Everyone it is for, in the order the Giver chose them (brain `ADR-0044`). */
  readonly receiverAccountIds: readonly string[];
  readonly message: string;
  /** Who besides the Giver and the Receivers may read it. */
  readonly visibility: string;
  /** The Members picked when the Visibility is Selected people. */
  readonly selectedAccountIds: readonly string[];
  /** How it looks, when it was written on a postcard. */
  readonly postcard?: PostcardSnapshot | undefined;
}

export interface OfferFeedbackResult {
  readonly id: string;
}

/**
 * The Giver gives one or more Members of their Workspace Feedback without being asked — Offered
 * Feedback — and chooses who besides them may read it. No Feedback Request and no Ask come into
 * being; the Feedback goes straight to its Receivers, as one piece they all receive.
 *
 * Every Receiver and every person selected are checked against the Workspace, in one read, before
 * anything is written, so a body naming somebody outside it stores nothing — not even for the
 * Receivers who are in it. What the Feedback
 * message names is bound then too, in the same read-before-write. Who may then open
 * it is decided where one piece of Feedback is read, by the same rule as for an answer.
 */
@Injectable()
export class OfferFeedbackUseCase {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
    private readonly tagsService: TagsService,
    private readonly idGenerator: IdGenerator,
    private readonly unitOfWork: UnitOfWork,
    private readonly outbox: Outbox,
  ) {}

  async execute(input: OfferFeedbackInput): Promise<OfferFeedbackResult> {
    const message = FeedbackMessage.of(input.message);
    const visibility = Visibility.of({
      value: input.visibility,
      selectedAccountIds: input.selectedAccountIds,
    });
    const postcard = input.postcard ? Postcard.of(input.postcard) : null;

    const members = new Set(
      await this.workspaceMembershipPort.membersAmong({
        workspaceId: input.workspaceId,
        accountIds: [...input.receiverAccountIds, ...input.selectedAccountIds],
      }),
    );
    if (
      !input.receiverAccountIds.every((accountId) => members.has(accountId))
    ) {
      throw new ReceiverNotInWorkspaceError();
    }
    if (
      !input.selectedAccountIds.every((accountId) => members.has(accountId))
    ) {
      throw new SelectedPersonNotInWorkspaceError();
    }
    const tags = await this.tagsService.boundIn(
      input.workspaceId,
      message.toString(),
    );

    const feedback = Feedback.offer({
      id: this.idGenerator.next(),
      workspaceId: input.workspaceId,
      giverAccountId: input.giverAccountId,
      receiverAccountIds: input.receiverAccountIds,
      visibility,
      message,
      tags,
      postcard,
    });

    const written = feedback.snapshot();

    await this.unitOfWork.run(async () => {
      await this.feedbackRepository.save(feedback);
      // Everyone it was written to, and anyone else it was shared with. A Receiver is never
      // counted twice: Notifications de-duplicates to the wording that is true of them.
      await this.outbox.enqueue([
        {
          type: FEEDBACK_WRITTEN_TYPE,
          idempotencyKey: `${FEEDBACK_WRITTEN_TYPE}:${written.id}`,
          payload: {
            workspaceId: input.workspaceId,
            actorAccountId: input.giverAccountId,
            receiverAccountIds: written.receiverAccountIds,
            sharedWithAccountIds: visibility.selectedAccountIds(),
            feedbackId: written.id,
          },
        },
      ]);
      if (visibility.isEveryone()) {
        // Enqueued in the same transaction as the Feedback, so the promise to tell the channel
        // cannot survive a rollback and cannot be lost after a commit (ADR 0076). The channel is
        // told who gave Feedback to whom and nothing of what it said (brain `ADR-0040`); which
        // tool, which channel, and whether there is one at all are Integrations' (ADR 0062).
        await this.outbox.enqueue([
          {
            type: FEEDBACK_PUBLISHED_TYPE,
            idempotencyKey: `${FEEDBACK_PUBLISHED_TYPE}:${written.id}`,
            payload: {
              workspaceId: input.workspaceId,
              giverAccountId: input.giverAccountId,
              receiverAccountIds: written.receiverAccountIds,
              feedbackId: written.id,
            },
          },
        ]);
      }
    });
    return { id: written.id };
  }
}
