import { Injectable } from '@nestjs/common';
import { AskStatus } from '../../domain/value-object/ask-status.vo';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { PeopleService } from '../service/people.service';
import type {
  FeedItemShow,
  FeedItemsView,
} from '../types/feedback-request.types';
import type { CursorPageRequest } from '../types/kudos.types';

export interface ListFeedItemsInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Who is reading: the signed-in caller, always. Never read from the query. */
  readonly readerAccountId: string;
  readonly show: FeedItemShow;
  readonly page: CursorPageRequest;
}

/**
 * A query: what one Member reads on Home — Everyone, what they were selected to read, or both —
 * newest first, with both people named and an answer with its question and everyone asked.
 *
 * It builds no `Visibility`. The read applied it (ADR 0044), so there is nothing here that could
 * widen what came back, and the reader is an argument to that read rather than a filter after it
 * (`BE_21` R4). Home's two lists are one read so one cursor can page them (ADR 0071).
 */
@Injectable()
export class ListFeedItemsUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly peopleService: PeopleService,
  ) {}

  async execute(input: ListFeedItemsInput): Promise<FeedItemsView> {
    const feedItems = await this.feedbackRequestQuery.feedItemsFor(
      input.workspaceId,
      input.readerAccountId,
      input.show,
      input.page,
    );
    const people = await this.peopleService.peopleIn(
      input.workspaceId,
      feedItems.items.flatMap((feedback) => [
        feedback.giverAccountId,
        ...feedback.receiverAccountIds,
        ...(feedback.request
          ? [
              feedback.request.requesterAccountId,
              ...feedback.request.asks.map((ask) => ask.giverAccountId),
            ]
          : []),
      ]),
    );

    return {
      items: feedItems.items.map((feedback) => ({
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
        visibility: feedback.visibility,
        request: feedback.request && {
          message: feedback.request.message,
          tags: feedback.request.tags,
          requester: people.personOf(feedback.request.requesterAccountId),
          asked: feedback.request.asks.map((ask) => ({
            person: people.personOf(ask.giverAccountId),
            status: AskStatus.of(ask.status).toString(),
            answer: ask.answer,
          })),
        },
      })),
      nextAfterId: feedItems.hasMore
        ? (feedItems.items.at(-1)?.id ?? null)
        : null,
    };
  }
}
