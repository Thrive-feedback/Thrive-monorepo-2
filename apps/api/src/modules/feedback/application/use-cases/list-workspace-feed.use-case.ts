import { Injectable } from '@nestjs/common';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { PeopleService } from '../service/people.service';
import type {
  PageRequest,
  WorkspaceFeedView,
} from '../types/feedback-request.types';

export interface ListWorkspaceFeedInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  readonly page: PageRequest;
}

/**
 * A query: the Feedback of this Workspace that every Member may read — whatever a Requester or a
 * Giver set to Everyone — newest first, with both people named.
 *
 * **It takes no account id, which is why the guard on its route is load-bearing.** Every other
 * read in this module is scoped to a person as well as a Workspace, and so refuses a stranger
 * twice; this one refuses them only at the Workspace boundary. Everyone means every Member, and
 * what makes the caller a Member is `WorkspaceMemberGuard` having already said so (ADR 0042).
 *
 * The Visibility itself is applied by the read, not here (ADR 0044).
 */
@Injectable()
export class ListWorkspaceFeedUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly peopleService: PeopleService,
  ) {}

  async execute(input: ListWorkspaceFeedInput): Promise<WorkspaceFeedView> {
    const feed = await this.feedbackRequestQuery.publicIn(
      input.workspaceId,
      input.page,
    );
    const people = await this.peopleService.peopleIn(
      input.workspaceId,
      feed.items.flatMap((feedback) => [
        feedback.giverAccountId,
        ...feedback.receiverAccountIds,
      ]),
    );

    return {
      items: feed.items.map((feedback) => ({
        id: feedback.id,
        origin: feedback.origin,
        feedbackRequestId: feedback.feedbackRequestId,
        giverAccountId: feedback.giverAccountId,
        // An Account cascades away with the person, so a missing one was deleted mid-read.
        giverName: people.nameOf(feedback.giverAccountId),
        giverPhotoUrl: people.photoOf(feedback.giverAccountId),
        giverStatus: people.statusOf(feedback.giverAccountId),
        receivers: feedback.receiverAccountIds.map(people.personOf),
        message: feedback.message,
        tags: feedback.tags,
        createdAt: feedback.createdAt,
      })),
      total: feed.total,
    };
  }
}
