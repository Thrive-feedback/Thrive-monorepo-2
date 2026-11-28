import { Injectable } from '@nestjs/common';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { KudosQuery } from '../query-port/kudos.query-port';
import {
  PersonalItemsService,
  withAnswersReadableBy,
} from '../service/personal-items.service';
import type {
  CursorPageRequest,
  FeedPageRequest,
  FeedPosition,
} from '../types/kudos.types';
import type {
  ProfileItemShow,
  ProfileItemsView,
} from '../types/personal-item.types';

export interface ListProfileItemsInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose Profile it is: anyone, the caller included. */
  readonly accountId: string;
  /** Who is reading: the signed-in caller, always. Never read from the query. */
  readonly readerAccountId: string;
  readonly show: ProfileItemShow;
  /**
   * Only what was written at or after this instant, or everything for `null`. It only narrows. The
   * Asks open are every one still open, so `OPEN_ASKS` takes none; the presentation refuses one.
   */
  readonly since: Date | null;
  readonly page: CursorPageRequest;
}

const NOTHING: ProfileItemsView = { items: [], nextAfterId: null };

/** The lists about the reader and the Member together, which hold nothing on one's own Profile. */
const FOR_THE_READER: readonly ProfileItemShow[] = [
  'BETWEEN_US',
  'SHARED_WITH_ME',
  'OPEN_ASKS',
];

/**
 * A query: what a Profile shows of one Member in this Workspace, newest first, each with the card it
 * was written on (ADR 0091, ADR 0097). Two lists are the same for everyone:
 * - `FEEDBACK`, the Feedback given to them that the whole Workspace reads, asked for or not;
 * - `KUDOS`, the Kudos that name them.
 * Three are the reader's own:
 * - `BETWEEN_US`, the Feedback and Kudos between the reader and them, at every Visibility;
 * - `SHARED_WITH_ME`, the Feedback given to them that somebody selected the reader to read;
 * - `OPEN_ASKS`, the Asks still open between the two, either way.
 *
 * The reader already reads all of it on Home, on the Kudos board, or in their own Received, Given and
 * Waiting for me, so a Profile shows nothing new, only gathers it by person. The reader's own lists
 * are empty on their own Profile. The reader is an argument to those reads rather than a filter
 * after them.
 */
@Injectable()
export class ListProfileItemsUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly kudosQuery: KudosQuery,
    private readonly personalItemsService: PersonalItemsService,
  ) {}

  async execute(input: ListProfileItemsInput): Promise<ProfileItemsView> {
    // Nothing is between a Member and themselves. Asked anyway, "written to both" would be
    // everything written to them, their private Feedback among it.
    if (
      FOR_THE_READER.includes(input.show) &&
      input.accountId === input.readerAccountId
    ) {
      return NOTHING;
    }
    const after = await this.positionAfter(input);
    if (after === undefined) {
      return NOTHING;
    }
    const shown = await this.personalItemsService.read({
      workspaceId: input.workspaceId,
      after,
      limit: input.page.limit,
      feedback: this.feedbackOf(input),
      kudos: this.kudosOf(input),
      asks: this.asksOf(input),
    });
    return { items: shown.items, nextAfterId: shown.next?.id ?? null };
  }

  /**
   * Where the row the cursor names sits. Among the open Asks it is an Ask, which is kept once it is
   * answered, so a page that ended on one still goes on from it.
   */
  private async positionAfter({
    workspaceId,
    show,
    page,
  }: ListProfileItemsInput): Promise<FeedPosition | null | undefined> {
    if (show !== 'OPEN_ASKS' || page.afterId === null) {
      return this.personalItemsService.positionAfter(workspaceId, page.afterId);
    }
    return (
      (await this.feedbackRequestQuery.askPositionOf(
        workspaceId,
        page.afterId,
      )) ?? undefined
    );
  }

  /** The read of the Feedback a list holds, or none. */
  private feedbackOf({
    workspaceId,
    accountId,
    readerAccountId,
    show,
    since,
  }: ListProfileItemsInput) {
    switch (show) {
      case 'FEEDBACK':
        return (page: FeedPageRequest) =>
          this.feedbackRequestQuery.everyoneFeedbackTo(
            workspaceId,
            accountId,
            page,
            since,
          );
      case 'SHARED_WITH_ME':
        return (page: FeedPageRequest) =>
          this.feedbackRequestQuery.sharedFeedbackTo(
            workspaceId,
            accountId,
            readerAccountId,
            page,
            since,
          );
      case 'BETWEEN_US':
        // When the reader wrote an answer, the other answers on its card keep only what they may
        // read, as in their Given.
        return async (page: FeedPageRequest) => {
          const between = await this.feedbackRequestQuery.feedbackBetween(
            workspaceId,
            readerAccountId,
            accountId,
            page,
            since,
          );
          return {
            items: between.items.map((row) =>
              withAnswersReadableBy(readerAccountId, row),
            ),
            hasMore: between.hasMore,
          };
        };
      case 'KUDOS':
      case 'OPEN_ASKS':
        return undefined;
    }
  }

  /** The read of the Kudos a list holds, or none. */
  private kudosOf({
    workspaceId,
    accountId,
    readerAccountId,
    show,
    since,
  }: ListProfileItemsInput) {
    switch (show) {
      case 'KUDOS':
        // Naming the person leaves out a Kudos for the whole Workspace, which names nobody.
        return (page: FeedPageRequest) =>
          this.kudosQuery.onHome(workspaceId, page, accountId, since);
      case 'BETWEEN_US':
        return (page: FeedPageRequest) =>
          this.kudosQuery.kudosBetween(
            workspaceId,
            readerAccountId,
            accountId,
            page,
            since,
          );
      case 'FEEDBACK':
      case 'SHARED_WITH_ME':
      case 'OPEN_ASKS':
        return undefined;
    }
  }

  /** The read of the open Asks, which only their own list holds. */
  private asksOf({
    workspaceId,
    accountId,
    readerAccountId,
    show,
  }: ListProfileItemsInput) {
    if (show !== 'OPEN_ASKS') {
      return undefined;
    }
    return (page: FeedPageRequest) =>
      this.feedbackRequestQuery.pendingAsksBetween(
        workspaceId,
        readerAccountId,
        accountId,
        page,
      );
  }
}
