import type { AskStatusValue } from '../../domain/value-object/ask-status.vo';
import type { PageRequest } from '../types/feedback-request.types';

/** One Ask, as stored. Names are Identity's and are added above this port. */
export interface FeedbackRequestAskRow {
  readonly askId: string;
  readonly giverAccountId: string;
  readonly status: string;
}

/** One Feedback Request, as stored. */
export interface FeedbackRequestRow {
  readonly id: string;
  /** The Member who asked. Read so the use case can refuse everybody else. */
  readonly requesterAccountId: string;
  readonly topic: string;
  readonly visibility: string;
  readonly asks: readonly FeedbackRequestAskRow[];
  readonly createdAt: Date;
}

export interface FeedbackRequestPageRow {
  readonly items: readonly FeedbackRequestRow[];
  readonly total: number;
}

/** One Ask with the request it belongs to, as the Giver asked reads it. */
export interface FeedbackAskRow {
  readonly askId: string;
  readonly feedbackRequestId: string;
  readonly topic: string;
  /** The Member who asked. Their name is Identity's and is added above this port. */
  readonly requesterAccountId: string;
  readonly status: string;
  readonly createdAt: Date;
}

export interface FeedbackAskPageRow {
  readonly items: readonly FeedbackAskRow[];
  readonly total: number;
}

export interface FeedbackAnswerRow {
  readonly askId: string;
  readonly body: string;
  readonly answeredAt: Date;
}

export abstract class FeedbackRequestQuery {
  /**
   * One request of one Workspace with its Asks, or `null`. The Workspace is a required
   * argument, so a read scoped to nothing cannot be written.
   */
  abstract requestInWorkspace(
    workspaceId: string,
    requestId: string,
  ): Promise<FeedbackRequestRow | null>;

  /**
   * The answers written in one request, by Ask. Read on its own rather than joined onto every
   * request: only the screen that opens one request shows them, and who may read which is the
   * use case's to decide.
   */
  abstract answersInRequest(
    workspaceId: string,
    requestId: string,
  ): Promise<readonly FeedbackAnswerRow[]>;

  /** The requests one Member sent in one Workspace, newest first. */
  abstract sentInWorkspace(
    workspaceId: string,
    requesterAccountId: string,
    page: PageRequest,
  ): Promise<FeedbackRequestPageRow>;

  /**
   * The Asks addressed to one Member in one Workspace, newest first. The Giver is a required
   * argument for the same reason the Workspace is: one Member's Asks are not another's.
   */
  abstract asksFor(
    workspaceId: string,
    giverAccountId: string,
    status: AskStatusValue,
    page: PageRequest,
  ): Promise<FeedbackAskPageRow>;

  /** One Ask addressed to one Member, or `null` when it is not theirs or does not exist. */
  abstract askFor(
    workspaceId: string,
    giverAccountId: string,
    askId: string,
  ): Promise<FeedbackAskRow | null>;
}
