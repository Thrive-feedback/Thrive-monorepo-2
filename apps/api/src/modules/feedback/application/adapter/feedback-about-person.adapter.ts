import { Injectable } from '@nestjs/common';
import {
  FeedbackAboutPersonPort,
  type ProfileItemKind,
} from '../../domain/port/feedback-about-person.port';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { KudosQuery } from '../query-port/kudos.query-port';

/**
 * Answers the port from the filters a Profile's lists read, with the id added, so whether an item is
 * on a Profile can never disagree with the Profile itself (ADR 0097).
 */
@Injectable()
export class FeedbackAboutPersonAdapter extends FeedbackAboutPersonPort {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly kudosQuery: KudosQuery,
  ) {
    super();
  }

  isOnProfileFor({
    workspaceId,
    readerAccountId,
    aboutAccountId,
    kind,
    id,
  }: {
    readonly workspaceId: string;
    readonly readerAccountId: string;
    readonly aboutAccountId: string;
    readonly kind: ProfileItemKind;
    readonly id: string;
  }): Promise<boolean> {
    switch (kind) {
      case 'FEEDBACK':
        return this.feedbackRequestQuery.isFeedbackOnProfileFor(
          workspaceId,
          readerAccountId,
          aboutAccountId,
          id,
        );
      case 'KUDOS':
        return this.kudosQuery.isKudosOnProfileFor(
          workspaceId,
          readerAccountId,
          aboutAccountId,
          id,
        );
      case 'ASK':
        return this.feedbackRequestQuery.isAskOpenBetween(
          workspaceId,
          readerAccountId,
          aboutAccountId,
          id,
        );
    }
  }
}
