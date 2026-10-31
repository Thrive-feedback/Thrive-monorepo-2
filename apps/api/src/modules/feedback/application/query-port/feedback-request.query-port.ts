import type { FeedbackOrigin } from '../../domain/entity/feedback.entity';
import type { AskStatusValue } from '../../domain/value-object/ask-status.vo';
import type {
  AnswerPostcardSnapshot,
  PostcardSnapshot,
} from '../../domain/value-object/postcard.vo';
import type { VisibilityValue } from '../../domain/value-object/visibility.vo';
import type {
  AnswerView,
  FeedItemShow,
  FeedItemVisibility,
  PageRequest,
  TagsView,
  WaitingAskSort,
} from '../types/feedback-request.types';
import type { CursorPageRequest } from '../types/kudos.types';

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
  readonly message: string;
  readonly postcard: PostcardSnapshot | null;
  readonly tags: TagsView;
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
  readonly message: string;
  readonly tags: TagsView;
  /** The Member who asked. Their name is Identity's and is added above this port. */
  readonly requesterAccountId: string;
  readonly status: string;
  readonly createdAt: Date;
}

/**
 * One Ask with the Visibility its request chose, as the Giver opening it reads it: enough to tell
 * them whether their answer goes on the Workspace feed, and nothing about who else may read it.
 * The card is the one the answer is written on.
 */
export interface FeedbackAskWithVisibilityRow extends FeedbackAskRow {
  readonly visibility: VisibilityValue;
  /** How the request looks, or `null` when it was not written on a postcard. */
  readonly postcard: PostcardSnapshot | null;
}

export interface FeedbackAskPageRow {
  readonly items: readonly FeedbackAskRow[];
  readonly total: number;
}

/** One page of the Asks waiting on a Member, and whether another follows. */
export interface WaitingAskPageRow {
  readonly items: readonly FeedbackAskRow[];
  readonly hasMore: boolean;
}

export interface FeedbackAnswerRow {
  readonly askId: string;
  readonly message: string;
  readonly tags: TagsView;
  readonly answeredAt: Date;
}

/**
 * One piece of Feedback as a Member it was written to reads it. The names are Identity's and
 * are added above this port.
 */
export interface FeedbackRow {
  readonly id: string;
  readonly origin: FeedbackOrigin;
  /** The request it answers, or `null` for Feedback given without being asked. */
  readonly feedbackRequestId: string | null;
  readonly giverAccountId: string;
  /** Everyone it is for, the reader among them, in the order the Giver chose them. */
  readonly receiverAccountIds: readonly string[];
  readonly message: string;
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
  readonly giverAccountId: string;
  /** Everyone it is for, in the order the Giver chose them: one for Requested Feedback. */
  readonly receiverAccountIds: readonly string[];
  readonly message: string;
  readonly postcard: PostcardSnapshot | null;
  /** What its Giver wrote is bound to. */
  readonly tags: TagsView;
  readonly createdAt: Date;
  readonly visibility: string;
  readonly selectedAccountIds: readonly string[];
}

/** One answer on a request's card, with the Visibility it holds itself. */
export interface OpenedAnswerRow {
  readonly id: string;
  readonly giverAccountId: string;
  readonly message: string;
  readonly tags: TagsView;
  readonly postcard: AnswerPostcardSnapshot | null;
  readonly answeredAt: Date;
  readonly visibility: string;
  readonly selectedAccountIds: readonly string[];
}

/** A request with what is on its card: every answer, in the order their Givers were asked. */
export interface OpenedRequestRow {
  readonly message: string;
  readonly tags: TagsView;
  readonly requesterAccountId: string;
  readonly postcard: PostcardSnapshot | null;
  readonly answers: readonly OpenedAnswerRow[];
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
  readonly giverAccountId: string;
  /** Everyone it is for, in the order the Giver chose them: one for Requested Feedback. */
  readonly receiverAccountIds: readonly string[];
  readonly message: string;
  /** What its Giver wrote is bound to. */
  readonly tags: TagsView;
  readonly createdAt: Date;
}

export interface FeedbackWithPeoplePageRow {
  readonly items: readonly FeedbackWithPeopleRow[];
  readonly total: number;
}

/** The request a piece of Requested Feedback answers, as the Workspace feed shows it. */
export interface AnsweredRequestRow {
  readonly message: string;
  /** What the Request message was bound to when it was sent. */
  readonly tags: TagsView;
  readonly requesterAccountId: string;
  /** Everyone the request asked, in the order they were asked, whatever became of their Ask. */
  readonly askedAccountIds: readonly string[];
}

/** One piece of Feedback on the Workspace feed: `request` is `null` for Offered Feedback. */
export interface WorkspaceFeedRow extends FeedbackWithPeopleRow {
  readonly request: AnsweredRequestRow | null;
}

export interface WorkspaceFeedPageRow {
  readonly items: readonly WorkspaceFeedRow[];
  readonly total: number;
}

/** One Ask of a request on Home, with its answer once there is one. */
export interface FeedItemAskRow {
  readonly giverAccountId: string;
  readonly status: string;
  readonly answer: AnswerView | null;
}

/** The request a piece on Home answers, and every Ask it holds, in the order they were asked. */
export interface FeedItemRequestRow {
  readonly message: string;
  /** What the Request message was bound to when it was sent. */
  readonly tags: TagsView;
  readonly requesterAccountId: string;
  readonly asks: readonly FeedItemAskRow[];
}

/** One piece on Home: `request` is `null` for Offered Feedback. */
export interface FeedItemRow extends FeedbackWithPeopleRow {
  readonly visibility: FeedItemVisibility;
  readonly request: FeedItemRequestRow | null;
}

export interface FeedItemPageRow {
  readonly items: readonly FeedItemRow[];
  /** Whether another page follows this one. */
  readonly hasMore: boolean;
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
   * The Asks still waiting on one Member, in the order asked for, paged by cursor (ADR 0059). An
   * Ask leaves this list when it is answered, so the Ask a cursor names may no longer be in it.
   */
  abstract waitingAsksFor(
    workspaceId: string,
    giverAccountId: string,
    sort: WaitingAskSort,
    page: CursorPageRequest,
  ): Promise<WaitingAskPageRow>;

  /**
   * The Feedback written to one Member in one Workspace — as its only Receiver or one of several
   * — newest first. The Receiver is a
   * required argument for the same reason the Workspace is: one Member's Feedback is not
   * another's, and a read scoped to nobody cannot be written.
   */
  abstract receivedBy(
    workspaceId: string,
    receiverAccountId: string,
    page: PageRequest,
  ): Promise<FeedbackPageRow>;

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
  ): Promise<WorkspaceFeedPageRow>;

  /**
   * What one Member reads on Home in one Workspace, newest first: Everyone, what they were selected
   * to read, or both. One read, so one cursor names a place in all of it. A Giver or a Receiver
   * cannot be selected, so a Selected piece of their own is not here: it belongs to their history.
   *
   * The Visibility is applied here for the reason `sharedWith` applies it (ADR 0044): a page has to
   * hold only what this reader may read.
   */
  abstract feedItemsFor(
    workspaceId: string,
    readerAccountId: string,
    show: FeedItemShow,
    page: CursorPageRequest,
  ): Promise<FeedItemPageRow>;

  /**
   * One piece of Feedback of one Workspace, or `null`. Not scoped to a reader: who may read it
   * depends on the Visibility it carries, which is the use case's to apply.
   */
  abstract feedbackInWorkspace(
    workspaceId: string,
    feedbackId: string,
  ): Promise<FeedbackWithVisibilityRow | null>;

  /**
   * A request's card and every answer on it, each with its own Visibility, or `null`. It applies no
   * Visibility: a caller must hold each answer to its own (ADR 0072).
   */
  abstract openedRequest(
    workspaceId: string,
    requestId: string,
  ): Promise<OpenedRequestRow | null>;

  /** One Ask addressed to one Member, or `null` when it is not theirs or does not exist. */
  abstract askFor(
    workspaceId: string,
    giverAccountId: string,
    askId: string,
  ): Promise<FeedbackAskWithVisibilityRow | null>;
}
