import { PersonNotifierPort } from '@app/modules/notifications';
import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable, Logger } from '@nestjs/common';
import { Feedback } from '../../domain/entity/feedback.entity';
import { FeedbackRepository } from '../../domain/repository/feedback-repository.port';
import { FeedbackMessage } from '../../domain/value-object/feedback-message.vo';
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
  private readonly logger = new Logger(OfferFeedbackUseCase.name);

  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
    private readonly tagsService: TagsService,
    private readonly idGenerator: IdGenerator,
    private readonly unitOfWork: UnitOfWork,
    private readonly personNotifierPort: PersonNotifierPort,
  ) {}

  async execute(input: OfferFeedbackInput): Promise<OfferFeedbackResult> {
    const message = FeedbackMessage.of(input.message);
    const visibility = Visibility.of({
      value: input.visibility,
      selectedAccountIds: input.selectedAccountIds,
    });

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
    });

    await this.unitOfWork.run(() => this.feedbackRepository.save(feedback));

    const written = feedback.snapshot();
    // After the Feedback has committed, and never awaited: giving Feedback must not be held up
    // by a chat tool, nor fail because one is unreachable (`ADR-0035` §8, design 0021 D5).
    //
    // This use case only ever makes `OFFERED` Feedback — an answer to an Ask is made by
    // `AnswerFeedbackAskUseCase`, and a `CHECK` constraint on the table holds those two apart —
    // so the two messages cannot overlap: an answered request is #214's, this is #215's.
    void this.personNotifierPort
      .feedbackWritten({
        workspaceId: input.workspaceId,
        actorAccountId: input.giverAccountId,
        receiverAccountIds: written.receiverAccountIds,
        // Whoever the Giver chose may read it, so they are told it was shared with them. A
        // Receiver is never counted twice: the notifier de-duplicates to the wording that is
        // true of them.
        sharedWithAccountIds: visibility.selectedAccountIds(),
        feedbackId: written.id,
      })
      .catch((error: unknown) => {
        // The port promises not to reject, so this is the belt to its braces.
        this.logger.warn({
          event: 'feedback.notify_failed',
          notification: 'feedbackWritten',
          error: error instanceof Error ? error.message : 'unknown',
        });
      });

    return { id: written.id };
  }
}
