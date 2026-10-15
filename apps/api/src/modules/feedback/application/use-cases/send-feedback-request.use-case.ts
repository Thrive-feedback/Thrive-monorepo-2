import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import { FeedbackRequestRepository } from '../../domain/repository/feedback-request-repository.port';
import { Topic } from '../../domain/value-object/topic.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import {
  GiverNotInWorkspaceError,
  SelectedPersonNotInWorkspaceError,
} from '../feedback-request.errors';

export interface SendFeedbackRequestInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  readonly requesterAccountId: string;
  readonly topic: string;
  readonly giverAccountIds: readonly string[];
  /** Who besides the Requester and the Givers may read the answers. */
  readonly visibility: string;
  /** The Members picked when the Visibility is Selected people. */
  readonly selectedAccountIds: readonly string[];
}

export interface SendFeedbackRequestResult {
  readonly id: string;
}

/**
 * The Requester asks Members of their Workspace for Feedback on a Topic, and chooses who besides
 * them may read the answers. That creates the request and one Ask per Member asked.
 *
 * Every Giver and every person selected is checked against the Workspace, in one read, before
 * anything is written, so a body naming somebody outside it stores nothing.
 */
@Injectable()
export class SendFeedbackRequestUseCase {
  constructor(
    private readonly feedbackRequestRepository: FeedbackRequestRepository,
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
    private readonly idGenerator: IdGenerator,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    input: SendFeedbackRequestInput,
  ): Promise<SendFeedbackRequestResult> {
    const topic = Topic.of(input.topic);
    const visibility = Visibility.of({
      value: input.visibility,
      selectedAccountIds: input.selectedAccountIds,
    });

    const members = new Set(
      await this.workspaceMembershipPort.membersAmong({
        workspaceId: input.workspaceId,
        accountIds: [...input.giverAccountIds, ...input.selectedAccountIds],
      }),
    );
    if (!input.giverAccountIds.every((accountId) => members.has(accountId))) {
      throw new GiverNotInWorkspaceError();
    }
    if (
      !input.selectedAccountIds.every((accountId) => members.has(accountId))
    ) {
      throw new SelectedPersonNotInWorkspaceError();
    }

    const request = FeedbackRequest.send({
      id: this.idGenerator.next(),
      workspaceId: input.workspaceId,
      requesterAccountId: input.requesterAccountId,
      topic,
      visibility,
      givers: input.giverAccountIds.map((giverAccountId) => ({
        askId: this.idGenerator.next(),
        giverAccountId,
      })),
    });

    await this.unitOfWork.run(() =>
      this.feedbackRequestRepository.save(request),
    );
    return { id: request.snapshot().id };
  }
}
