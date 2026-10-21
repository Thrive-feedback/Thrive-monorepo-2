import type { FeedbackOrigin } from '../../domain/entity/feedback.entity';
import type { AskStatusValue } from '../../domain/value-object/ask-status.vo';
import type { PageRequest, TagsView } from '../types/feedback-request.types';

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
  readonly topicTags: TagsView;
  readonly visibility: string;
  readonly selectedAccountIds: readonly string[];
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
  readonly topicTags: TagsView;
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
  readonly tags: TagsView;
  readonly answeredAt: Date;
}

/**
 * One piece of Feedback as the Member it was written to reads it. The Giver's name is
 * Identity's and is added above this port.
 */
export interface FeedbackRow {
  readonly id: string;
  readonly origin: FeedbackOrigin;
  /** The request it answers, or `null` for Feedback given without being asked. */
  readonly feedbackRequestId: string | null;
  readonly topic: string;
  /** The Topic's own if Offered, the request's if it answers one. */
  readonly topicTags: TagsView;
  readonly giverAccountId: string;
  readonly body: string;
  /** What its Giver wrote is bound to. */
  readonly tags: TagsView;
  readonly createdAt: Date;
}

/**
 * One piece of Feedback with its Visibility: everything needed to decide who may read it, in
 * one row. Names are Identity's and are added above this port.
 */
export interface FeedbackWithVisibilityRow {
  readonly id: string;
  readonly origin: FeedbackOrigin;
  /** The request it answers, or `null` for Feedback given without being asked. */
  readonly feedbackRequestId: string | null;
  readonly topic: string;
  /** The Topic's own if Offered, the request's if it answers one. */
  readonly topicTags: TagsView;
  readonly giverAccountId: string;
  readonly receiverAccountId: string;
  readonly body: string;
  /** What its Giver wrote is bound to. */
  readonly tags: TagsView;
  readonly createdAt: Date;
  readonly visibility: string;
  readonly selectedAccountIds: readonly string[];
}

export interface FeedbackPageRow {
  readonly items: readonly FeedbackRow[];
  readonly total: number;
}

/**
 * One piece of Feedback with both of its people, as a list read that has already applied the
 * Visibility hands it over. It carries no Visibility: the read decided who may see it, and the
 * use case above has nothing left to re-check (ADR 0044). Names are Identity's and are added
 * above this port.
 */
export interface FeedbackWithPeopleRow {
  readonly id: string;
  readonly origin: FeedbackOrigin;
  /** The request it answers, or `null` for Feedback given without being asked. */
  readonly feedbackRequestId: string | null;
  readonly topic: string;
  /** The Topic's own if Offered, the request's if it answers one. */
  readonly topicTags: TagsView;
  readonly giverAccountId: string;
  readonly receiverAccountId: string;
  readonly body: string;
  /** What its Giver wrote is bound to. */
  readonly tags: TagsView;
  readonly createdAt: Date;
}

export interface FeedbackWithPeoplePageRow {
  readonly items: readonly FeedbackWithPeopleRow[];
  readonly total: number;
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

  /**
   * The Feedback written to one Member in one Workspace, newest first. The Receiver is a
   * required argument for the same reason the Workspace is: one Member's Feedback is not
   * another's, and a read scoped to nobody cannot be written.
   */
  abstract receivedBy(
    workspaceId: string,
    receiverAccountId: string,
    page: PageRequest,
  ): Promise<FeedbackPageRow>;

  /**
   * The Feedback one Member wrote in one Workspace — answers and Feedback given without being
   * asked alike — newest first. The Giver is a required argument for the same reason the
   * Workspace is: what one Member wrote is their own history, and a read scoped to nobody cannot
   * be written. Not filtered by Visibility: the Giver may always read what they wrote.
   */
  abstract givenBy(
    workspaceId: string,
    giverAccountId: string,
    page: PageRequest,
  ): Promise<FeedbackWithPeoplePageRow>;

  /**
   * The Feedback one Member was selected to read in one Workspace, newest first — Selected people
   * and nothing else. The reader is a required argument for the same reason the Workspace is: what
   * one Member was shown is not another's, and a read scoped to nobody cannot be written.
   *
   * The Visibility is applied here rather than above, because a page and its total have to count
   * only what this reader may read (ADR 0044).
   */
  abstract sharedWith(
    workspaceId: string,
    readerAccountId: string,
    page: PageRequest,
  ): Promise<FeedbackWithPeoplePageRow>;

  /**
   * The Feedback of one Workspace that every Member may read — Everyone and nothing else —
   * newest first. There is no reader argument, and that is the point: Everyone means every
   * Member, and a parameter the read would have to ignore is one somebody later believes.
   * Membership is proven before this runs (ADR 0042, ADR 0044).
   */
  abstract publicIn(
    workspaceId: string,
    page: PageRequest,
  ): Promise<FeedbackWithPeoplePageRow>;

  /**
   * One piece of Feedback of one Workspace, or `null`. Not scoped to a reader: who may read it
   * depends on the Visibility it carries, which is the use case's to apply.
   */
  abstract feedbackInWorkspace(
    workspaceId: string,
    feedbackId: string,
  ): Promise<FeedbackWithVisibilityRow | null>;

  /** One Ask addressed to one Member, or `null` when it is not theirs or does not exist. */
  abstract askFor(
    workspaceId: string,
    giverAccountId: string,
    askId: string,
  ): Promise<FeedbackAskRow | null>;
}
