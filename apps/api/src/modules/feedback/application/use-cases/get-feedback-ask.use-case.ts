import { Injectable } from '@nestjs/common';
import { AskStatus } from '../../domain/value-object/ask-status.vo';
import { FeedbackAskNotFoundError } from '../feedback-request.errors';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { PeopleService } from '../service/people.service';
import type { MyAskView } from '../types/feedback-request.types';

export interface GetFeedbackAskInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, from the session. An Ask is only ever read by its own Giver. */
  readonly giverAccountId: string;
  readonly askId: string;
}

/**
 * A query: one Ask waiting on the caller — who asked, and about what — which is what the screen
 * that answers it shows. The Giver is part of the read, so an Ask addressed to somebody else is
 * not found rather than refused, and nobody learns it exists.
 */
@Injectable()
export class GetFeedbackAskUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly peopleService: PeopleService,
  ) {}

  async execute(input: GetFeedbackAskInput): Promise<MyAskView> {
    const ask = await this.feedbackRequestQuery.askFor(
      input.workspaceId,
      input.giverAccountId,
      input.askId,
    );
    if (!ask) {
      throw new FeedbackAskNotFoundError();
    }
    const people = await this.peopleService.peopleIn(input.workspaceId, [
      ask.requesterAccountId,
    ]);

    return {
      askId: ask.askId,
      feedbackRequestId: ask.feedbackRequestId,
      topic: ask.topic,
      requesterAccountId: ask.requesterAccountId,
      requesterName: people.nameOf(ask.requesterAccountId),
      requesterStatus: people.statusOf(ask.requesterAccountId),
      status: AskStatus.of(ask.status).toString(),
      createdAt: ask.createdAt,
    };
  }
}
