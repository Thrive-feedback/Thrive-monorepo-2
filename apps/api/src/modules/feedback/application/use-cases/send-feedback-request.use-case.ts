import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import { FeedbackRequestRepository } from '../../domain/repository/feedback-request-repository.port';
import { Topic } from '../../domain/value-object/topic.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { GiverNotInWorkspaceError } from '../feedback-request.errors';

export interface SendFeedbackRequestInput {
  /** The Workspace the caller is a Member of, resolved before this runs (`BE_21` R3). */
  readonly workspaceId: string;
  readonly requesterAccountId: string;
  readonly topic: string;
  readonly giverAccountIds: readonly string[];
}

export interface SendFeedbackRequestResult {
  readonly id: string;
}

/**
 * The Requester asks Members of their Workspace for Feedback on a Topic, which creates the
 * request and one Ask per Member asked.
 *
 * Every Giver is checked against the Workspace before anything is written, so a body naming
 * somebody outside it stores nothing. Visibility is `ONLY_ME` until #83 lets the Requester
 * choose: the narrowest audience, so no answer collected now can be read more widely than the
 * Requester once choosing arrives.
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

    const inWorkspace = await Promise.all(
      input.giverAccountIds.map((accountId) =>
        this.workspaceMembershipPort.isMemberOf({
          workspaceId: input.workspaceId,
          accountId,
        }),
      ),
    );
    if (inWorkspace.some((isMember) => !isMember)) {
      throw new GiverNotInWorkspaceError();
    }

    const request = FeedbackRequest.send({
      id: this.idGenerator.next(),
      workspaceId: input.workspaceId,
      requesterAccountId: input.requesterAccountId,
      topic,
      visibility: Visibility.onlyMe(),
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
