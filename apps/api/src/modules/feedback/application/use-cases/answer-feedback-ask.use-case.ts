import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { FeedbackRequestRepository } from '../../domain/repository/feedback-request-repository.port';
import { FeedbackBody } from '../../domain/value-object/feedback-body.vo';
import { FeedbackAskNotFoundError } from '../feedback-request.errors';
import { TagsService } from '../service/tags.service';

export interface AnswerFeedbackAskInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller. An Ask is answered by its own Giver and by nobody else. */
  readonly giverAccountId: string;
  readonly askId: string;
  readonly body: string;
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
  ) {}

  async execute(
    input: AnswerFeedbackAskInput,
  ): Promise<AnswerFeedbackAskResult> {
    const body = FeedbackBody.of(input.body);
    // Only what the Giver wrote: the request's Topic has its own, which the answer never takes.
    const tags = await this.tagsService.boundIn(
      input.workspaceId,
      body.toString(),
    );

    return this.unitOfWork.run(async () => {
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
        body,
        tags,
      });
      // The load already matched the Ask to this Giver, so the aggregate not holding it means
      // it was removed between the two — the same answer as never having had it.
      if (!feedback) {
        throw new FeedbackAskNotFoundError();
      }
      await this.feedbackRequestRepository.saveAnswer(request, feedback);
      return { feedbackId: feedback.snapshot().id };
    });
  }
}
