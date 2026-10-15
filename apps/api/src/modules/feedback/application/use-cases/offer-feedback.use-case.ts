import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { Feedback } from '../../domain/entity/feedback.entity';
import { FeedbackRepository } from '../../domain/repository/feedback-repository.port';
import { FeedbackBody } from '../../domain/value-object/feedback-body.vo';
import { Topic } from '../../domain/value-object/topic.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import {
  ReceiverNotInWorkspaceError,
  SelectedPersonNotInWorkspaceError,
} from '../feedback-request.errors';

export interface OfferFeedbackInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. Never read from the body. */
  readonly giverAccountId: string;
  readonly receiverAccountId: string;
  readonly topic: string;
  readonly body: string;
  /** Who besides the Giver and the Receiver may read it. */
  readonly visibility: string;
  /** The Members picked when the Visibility is Selected people. */
  readonly selectedAccountIds: readonly string[];
}

export interface OfferFeedbackResult {
  readonly id: string;
}

/**
 * The Giver gives a Member of their Workspace Feedback without being asked — Offered Feedback —
 * and chooses who besides the two of them may read it. No Feedback Request and no Ask come into
 * being; the Feedback goes straight to the Receiver.
 *
 * The Receiver and every person selected are checked against the Workspace, in one read, before
 * anything is written, so a body naming somebody outside it stores nothing. Who may then open
 * it is decided where one piece of Feedback is read, by the same rule as for an answer.
 */
@Injectable()
export class OfferFeedbackUseCase {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
    private readonly idGenerator: IdGenerator,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: OfferFeedbackInput): Promise<OfferFeedbackResult> {
    const topic = Topic.of(input.topic);
    const body = FeedbackBody.of(input.body);
    const visibility = Visibility.of({
      value: input.visibility,
      selectedAccountIds: input.selectedAccountIds,
    });

    const members = new Set(
      await this.workspaceMembershipPort.membersAmong({
        workspaceId: input.workspaceId,
        accountIds: [input.receiverAccountId, ...input.selectedAccountIds],
      }),
    );
    if (!members.has(input.receiverAccountId)) {
      throw new ReceiverNotInWorkspaceError();
    }
    if (
      !input.selectedAccountIds.every((accountId) => members.has(accountId))
    ) {
      throw new SelectedPersonNotInWorkspaceError();
    }

    const feedback = Feedback.offer({
      id: this.idGenerator.next(),
      workspaceId: input.workspaceId,
      giverAccountId: input.giverAccountId,
      receiverAccountId: input.receiverAccountId,
      topic,
      visibility,
      body,
    });

    await this.unitOfWork.run(() => this.feedbackRepository.save(feedback));
    return { id: feedback.snapshot().id };
  }
}
