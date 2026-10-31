import { Injectable } from '@nestjs/common';
import { isEveryone } from '../../domain/value-object/visibility.vo';
import { FeedbackAskNotFoundError } from '../feedback-request.errors';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { toMyAskView } from '../service/my-ask-view.mapper';
import { PeopleService } from '../service/people.service';
import type { OpenedAskView } from '../types/feedback-request.types';

export interface GetFeedbackAskInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, from the session. An Ask is only ever read by its own Giver. */
  readonly giverAccountId: string;
  readonly askId: string;
}

/**
 * A query: one Ask waiting on the caller — who asked, about what, whether the answer goes on the
 * Workspace feed, and the card it is written on — which is what the screen that answers it shows. The Giver is part of the read, so an Ask addressed to somebody else is
 * not found rather than refused, and nobody learns it exists.
 */
@Injectable()
export class GetFeedbackAskUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly peopleService: PeopleService,
  ) {}

  async execute(input: GetFeedbackAskInput): Promise<OpenedAskView> {
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
      ...toMyAskView(ask, people),
      onWorkspaceFeed: isEveryone(ask.visibility),
      postcard: ask.postcard,
    };
  }
}
