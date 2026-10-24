import { PersonNotifierPort } from '@app/modules/notifications';
import { WorkspaceMembershipPort } from '@app/modules/workspace';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable, Logger } from '@nestjs/common';
import { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import { FeedbackRequestRepository } from '../../domain/repository/feedback-request-repository.port';
import { RequestMessage } from '../../domain/value-object/request-message.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import {
  GiverNotInWorkspaceError,
  SelectedPersonNotInWorkspaceError,
} from '../feedback-request.errors';
import { TagsService } from '../service/tags.service';

export interface SendFeedbackRequestInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  readonly requesterAccountId: string;
  readonly message: string;
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
 * The Requester asks Members of their Workspace for Feedback with a Request message, and chooses who besides
 * them may read the answers. That creates the request and one Ask per Member asked.
 *
 * Every Giver and every person selected is checked against the Workspace, in one read, before
 * anything is written, so a body naming somebody outside it stores nothing.
 */
@Injectable()
export class SendFeedbackRequestUseCase {
  private readonly logger = new Logger(SendFeedbackRequestUseCase.name);

  constructor(
    private readonly feedbackRequestRepository: FeedbackRequestRepository,
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
    private readonly tagsService: TagsService,
    private readonly idGenerator: IdGenerator,
    private readonly unitOfWork: UnitOfWork,
    private readonly personNotifierPort: PersonNotifierPort,
  ) {}

  async execute(
    input: SendFeedbackRequestInput,
  ): Promise<SendFeedbackRequestResult> {
    const message = RequestMessage.of(input.message);
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
    const tags = await this.tagsService.boundIn(
      input.workspaceId,
      message.toString(),
    );

    const request = FeedbackRequest.send({
      id: this.idGenerator.next(),
      workspaceId: input.workspaceId,
      requesterAccountId: input.requesterAccountId,
      message,
      visibility,
      tags,
      givers: input.giverAccountIds.map((giverAccountId) => ({
        askId: this.idGenerator.next(),
        giverAccountId,
      })),
    });

    await this.unitOfWork.run(() =>
      this.feedbackRequestRepository.save(request),
    );

    const sent = request.snapshot();
    // After the request and its Asks have committed, and never awaited: asking for Feedback must
    // not be held up by a chat tool, nor fail because one is unreachable (`ADR-0035` §8,
    // design 0021 D5). Notifications decides who is told and how; this module does not know
    // whether that is a bell, a chat tool, or both.
    void this.personNotifierPort
      .askReceived({
        workspaceId: sent.workspaceId,
        actorAccountId: sent.requesterAccountId,
        giverAccountIds: sent.asks.map((ask) => ask.giverAccountId),
        requestMessage: sent.message,
        askIdByGiver: Object.fromEntries(
          sent.asks.map((ask) => [ask.giverAccountId, ask.id]),
        ),
      })
      .catch((error: unknown) => {
        // The port promises not to reject, so this is the belt to its braces: a fault here is
        // this module's bug, not a chat tool being down, and it still may not reach the caller.
        this.logger.warn({
          event: 'feedback.notify_failed',
          notification: 'askReceived',
          error: error instanceof Error ? error.message : 'unknown',
        });
      });

    return { id: sent.id };
  }
}
