import { FEEDBACK_PUBLISHED_TYPE } from '@app/modules/integrations';
import { ASK_ANSWERED_TYPE } from '@app/modules/notifications';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { Outbox } from '@app/shared/application/outbox.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { FeedbackRequestRepository } from '../../domain/repository/feedback-request-repository.port';
import { FeedbackMessage } from '../../domain/value-object/feedback-message.vo';
import {
  AnswerPostcard,
  type AnswerPostcardSnapshot,
} from '../../domain/value-object/postcard.vo';
import { isEveryone } from '../../domain/value-object/visibility.vo';
import { FeedbackAskNotFoundError } from '../feedback-request.errors';
import { TagsService } from '../service/tags.service';

export interface AnswerFeedbackAskInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller. An Ask is answered by its own Giver and by nobody else. */
  readonly giverAccountId: string;
  readonly askId: string;
  readonly message: string;
  /** How it looks, when it was written on the Ask's postcard. */
  readonly postcard?: AnswerPostcardSnapshot;
}

export interface AnswerFeedbackAskResult {
  readonly feedbackId: string;
}

/**
 * The Giver answers an Ask, which stores their Feedback for the Requester and leaves the Ask
 * Answered. This is the point the loop closes: until now a request could be sent, listed and
 * read, but never answered.
 *
 * The Ask is loaded by Workspace, id **and** Giver together, so an Ask that is not the
 * caller's is not found rather than refused — the same answer as for one that never existed,
 * which is what keeps one Member from learning that another was asked.
 *
 * Both writes go in one transaction: an Ask marked Answered with no Feedback beside it would
 * be a question whose answer nobody can read.
 */
@Injectable()
export class AnswerFeedbackAskUseCase {
  constructor(
    private readonly feedbackRequestRepository: FeedbackRequestRepository,
    private readonly tagsService: TagsService,
    private readonly idGenerator: IdGenerator,
    private readonly unitOfWork: UnitOfWork,
    private readonly outbox: Outbox,
  ) {}

  async execute(
    input: AnswerFeedbackAskInput,
  ): Promise<AnswerFeedbackAskResult> {
    const message = FeedbackMessage.of(input.message);
    const postcard = input.postcard ? AnswerPostcard.of(input.postcard) : null;
    // Only what the Giver wrote: the Request message has its own, which the answer never takes.
    const tags = await this.tagsService.boundIn(
      input.workspaceId,
      message.toString(),
    );

    const answered = await this.unitOfWork.run(async () => {
      const request = await this.feedbackRequestRepository.findByAskOfGiver(
        input.workspaceId,
        input.askId,
        input.giverAccountId,
      );
      if (!request) {
        throw new FeedbackAskNotFoundError();
      }
      const feedback = request.answerAsk({
        askId: input.askId,
        giverAccountId: input.giverAccountId,
        feedbackId: this.idGenerator.next(),
        message,
        tags,
        postcard,
      });
      // The load already matched the Ask to this Giver, so the aggregate not holding it means
      // it was removed between the two — the same answer as never having had it.
      if (!feedback) {
        throw new FeedbackAskNotFoundError();
      }
      await this.feedbackRequestRepository.saveAnswer(request, feedback);
      const asked = request.snapshot();
      const written = feedback.snapshot();
      // The Requester, and nobody else — not the other Givers on the same request, who were
      // never promised anything about each other (#214).
      await this.outbox.enqueue([
        {
          type: ASK_ANSWERED_TYPE,
          idempotencyKey: `${ASK_ANSWERED_TYPE}:${written.id}`,
          payload: {
            workspaceId: input.workspaceId,
            actorAccountId: input.giverAccountId,
            requesterAccountId: asked.requesterAccountId,
            feedbackRequestId: asked.id,
          },
        },
      ]);
      if (isEveryone(written.visibility)) {
        // In the answer's own transaction (ADR 0076). The Workspace feed shows public Feedback
        // whatever its origin, so a channel that showed only Offered Feedback would quietly
        // disagree with it (ADR 0062).
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
      return {
        feedbackId: written.id,
        feedbackRequestId: asked.id,
        requesterAccountId: asked.requesterAccountId,
      };
    });

    return { feedbackId: answered.feedbackId };
  }
}
