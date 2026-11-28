import type { FeedbackOrigin } from '../../domain/entity/feedback.entity';
import type { AskStatusValue } from '../../domain/value-object/ask-status.vo';
import type { InstantRange } from '../../domain/value-object/calendar-clock.vo';
import type {
  AnswerPostcardSnapshot,
  PostcardSnapshot,
} from '../../domain/value-object/postcard.vo';
import type { VisibilityValue } from '../../domain/value-object/visibility.vo';
import type { FeedbackGivenAt } from '../types/feed-items.types';
import type {
  AnswerView,
  FeedItemShow,
  FeedItemVisibility,
  PageRequest,
  TagsView,
  WaitingAskSort,
} from '../types/feedback-request.types';
import type {
  CursorPageRequest,
  FeedPageRequest,
  FeedPosition,
} from '../types/kudos.types';

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

/** One Ask waiting on a Member, and the card it was sent on. */
export interface WaitingAskRow extends FeedbackAskRow {
  /** How the request looks, or `null` when it was not written on a postcard. */
  readonly postcard: PostcardSnapshot | null;
}

/** One page of the Asks waiting on a Member, and whether another follows. */
export interface WaitingAskPageRow {
  readonly items: readonly WaitingAskRow[];
  readonly hasMore: boolean;
}

export interface FeedbackAnswerRow {
  readonly askId: string;
  readonly message: string;
  readonly tags: TagsView;
  readonly answeredAt: Date;
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

/** One piece on Home, with the card it is on: `request` is `null` for Offered Feedback. */
export interface FeedItemRow extends FeedbackWithPeopleRow {
  readonly visibility: FeedItemVisibility;
  readonly postcard: PostcardSnapshot | null;
  readonly request: ReceivedRequestRow | null;
}

/** The request an answer was written on, as stored, and the card it is on. */
export interface ReceivedRequestRow extends FeedItemRequestRow {
  readonly postcard: PostcardSnapshot | null;
  readonly answerPostcard: AnswerPostcardSnapshot | null;
}

/** One piece of Feedback a Member received, with the card it was written on, as stored. */
export interface ReceivedFeedbackRow extends FeedbackWithPeopleRow {
  readonly visibility: VisibilityValue;
  readonly postcard: PostcardSnapshot | null;
  readonly request: ReceivedRequestRow | null;
}

export interface ReceivedFeedbackPageRow {
  readonly items: readonly ReceivedFeedbackRow[];
  /** Whether another page follows this one. */
  readonly hasMore: boolean;
}

/** One Ask beside a Giver's own answer, and who may read what its Giver wrote. */
export interface GivenAskRow extends FeedItemAskRow {
  /** `null` until it is answered. */
  readonly answerAudience: {
    readonly visibility: VisibilityValue;
    readonly selectedAccountIds: readonly string[];
  } | null;
}

/** The request a Giver's answer was written on, and each Ask with who may read its answer. */
export interface GivenRequestRow extends Omit<ReceivedRequestRow, 'asks'> {
  readonly asks: readonly GivenAskRow[];
}

/** One piece of Feedback a Member wrote, with the card it was written on, as stored. */
export interface GivenFeedbackRow extends Omit<ReceivedFeedbackRow, 'request'> {
  readonly request: GivenRequestRow | null;
}

export interface GivenFeedbackPageRow {
  readonly items: readonly GivenFeedbackRow[];
  /** Whether another page follows this one. */
  readonly hasMore: boolean;
}

/** What one Ask of a Member's own request sent back, as stored. */
export interface SentRequestAnswerRow {
  readonly id: string;
  readonly message: string;
  readonly tags: TagsView;
  readonly postcard: AnswerPostcardSnapshot | null;
  readonly answeredAt: Date;
}

/** One Ask of a Member's own request, as stored, with its answer once there is one. */
export interface SentRequestAskRow {
  readonly giverAccountId: string;
  readonly status: string;
  readonly answer: SentRequestAnswerRow | null;
}

/** One request a Member sent, as their Received holds it. Names are added above this port. */
export interface SentRequestItemRow {
  readonly id: string;
  readonly requesterAccountId: string;
  readonly message: string;
  readonly tags: TagsView;
  readonly visibility: VisibilityValue;
  readonly selectedAccountIds: readonly string[];
  readonly postcard: PostcardSnapshot | null;
  readonly createdAt: Date;
  /** Its newest answer, or when it was sent while nobody has answered. */
  readonly latestActivityAt: Date;
  /** In the order they were asked. */
  readonly asks: readonly SentRequestAskRow[];
}

export interface SentRequestItemPageRow {
  readonly items: readonly SentRequestItemRow[];
  /** Whether another page follows this one. */
  readonly hasMore: boolean;
}

/** One Ask still waiting, with the request it asks. Names are added above this port. */
export interface PendingAskRow {
  /** The Ask's own id. */
  readonly id: string;
  readonly feedbackRequestId: string;
  readonly requesterAccountId: string;
  readonly giverAccountId: string;
  /** The Request message. */
  readonly message: string;
  readonly tags: TagsView;
  readonly postcard: PostcardSnapshot | null;
  /** When it was asked. */
  readonly createdAt: Date;
}

export interface PendingAskPageRow {
  readonly items: readonly PendingAskRow[];
  /** Whether another page follows this one. */
  readonly hasMore: boolean;
}

/** How many rows each of a Profile's Feedback reads holds, and how many Asks are open. */
export interface ProfileFeedbackCountsRow {
  /** To the Member, read by everyone. */
  readonly everyoneFeedback: number;
  /** To the Member, shared with the reader. */
  readonly sharedFeedback: number;
  /** Between the reader and the Member. */
  readonly feedbackBetween: number;
  /** Still open between the two, whenever asked. */
  readonly openAsks: number;
}

export interface FeedItemPageRow {
  readonly items: readonly FeedItemRow[];
  /** Whether another page follows this one. */
  readonly hasMore: boolean;
}

export abstract class FeedbackRequestQuery {
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
   * What one Member reads on Home in one Workspace, newest first: Everyone, what they were selected
   * to read, or both. One read, so one cursor names a place in all of it. A Giver or a Receiver
   * cannot be selected, so a Selected piece of their own is not here: it belongs to their history.
   *
   * The Visibility is applied here rather than above, because a page has to hold only what this
   * reader may read (ADR 0044).
   */
  abstract feedItemsFor(
    workspaceId: string,
    readerAccountId: string,
    show: FeedItemShow,
    page: FeedPageRequest,
  ): Promise<FeedItemPageRow>;

  /**
   * When each piece of Feedback this Member reads on Home was given, and whether it answered an
   * Ask, between two instants. It is the rows `feedItemsFor` pages through, read with the same
   * filter, so a count of them is a count of the list and the two cannot disagree (ADR 0095).
   */
  abstract feedItemsGivenIn(
    workspaceId: string,
    readerAccountId: string,
    show: FeedItemShow,
    within: InstantRange,
  ): Promise<readonly FeedbackGivenAt[]>;

  /**
   * The Feedback given to one Member unasked, past a place in their Received list, newest first, at
   * any Visibility: the Receiver is an argument, so nobody else's can be read through this. Answers
   * to their requests are not here; each is inside its request (`sentRequestItemsBy`).
   */
  abstract offeredItemsTo(
    workspaceId: string,
    receiverAccountId: string,
    page: FeedPageRequest,
  ): Promise<ReceivedFeedbackPageRow>;

  /**
   * The Feedback given to one Member that the whole Workspace reads, asked for or not, past a place
   * in their Profile, newest first. Only Everyone is here, whoever reads it — the Member themselves
   * too — so a Profile shows the same to everyone who opens it.
   *
   * The Visibility is applied here rather than above, because a page has to hold only what may be
   * shown (ADR 0044).
   */
  abstract everyoneFeedbackTo(
    workspaceId: string,
    receiverAccountId: string,
    page: FeedPageRequest,
    since: Date | null,
  ): Promise<ReceivedFeedbackPageRow>;

  /**
   * The Feedback given to one Member, asked for or not, that somebody selected one reader to read,
   * past a place in that Member's Profile, newest first: Home's Shared with me, narrowed to what was
   * written to them. A Giver or a Receiver cannot be selected, so the Member reading their own is
   * read nothing here, and neither is the Giver.
   *
   * The Visibility is applied here rather than above, because a page has to hold only what this
   * reader may read (ADR 0044).
   */
  abstract sharedFeedbackTo(
    workspaceId: string,
    receiverAccountId: string,
    readerAccountId: string,
    page: FeedPageRequest,
    since: Date | null,
  ): Promise<ReceivedFeedbackPageRow>;

  /**
   * The requests one Member sent, past a place in their Received list, each placed at its latest
   * activity, newest first, with every Ask and every answer. The Requester is an argument, so
   * nobody else's can be read through this. A request moves up when it is answered, so the place a
   * page starts from is a position, never a row looked up again.
   */
  abstract sentRequestItemsBy(
    workspaceId: string,
    requesterAccountId: string,
    page: FeedPageRequest,
  ): Promise<SentRequestItemPageRow>;

  /**
   * What one Member wrote past a place in the list, newest first, at every Visibility. Each Ask says
   * who may read its answer, which is the use case's to apply.
   */
  abstract givenItemsBy(
    workspaceId: string,
    giverAccountId: string,
    page: FeedPageRequest,
  ): Promise<GivenFeedbackPageRow>;

  /**
   * The Feedback between a reader and one Member, past a place in that Member's Profile, newest
   * first, at every Visibility. It is either written by one of the two with the other among its
   * Receivers, or written by somebody else to both of them. The reader is one of its two people, so
   * every piece is one they wrote or received. Each Ask says who may read its answer, which is the
   * use case's to apply, as in Given.
   */
  abstract feedbackBetween(
    workspaceId: string,
    readerAccountId: string,
    memberAccountId: string,
    page: FeedPageRequest,
    since: Date | null,
  ): Promise<GivenFeedbackPageRow>;

  /**
   * The Asks still waiting between a reader and one Member, past a place in that Member's Profile,
   * newest first by when each was asked. One asked the other, and the other has not answered.
   */
  abstract pendingAsksBetween(
    workspaceId: string,
    readerAccountId: string,
    memberAccountId: string,
    page: FeedPageRequest,
  ): Promise<PendingAskPageRow>;

  /**
   * How many rows each Profile read above holds for one reader and one Member: the Feedback from
   * `since` on, and every Ask still open. Each count reads with its list's own filter, so the two
   * cannot disagree (ADR 0095). With no reader, only what everyone reads is counted and the reader's
   * own lists are `0`: that is the Member's own Profile, as nothing is between oneself.
   */
  abstract profileCounts(
    workspaceId: string,
    readerAccountId: string | null,
    memberAccountId: string,
    since: Date | null,
  ): Promise<ProfileFeedbackCountsRow>;

  /**
   * Where one Ask of this Workspace sits, by when it was asked, or `null` if there is none. An Ask is
   * kept once answered, so a page that ended on one still finds its place.
   */
  abstract askPositionOf(
    workspaceId: string,
    askId: string,
  ): Promise<FeedPosition | null>;

  /** Where one piece of Feedback of this Workspace sits on Home, or `null` if it is not there. */
  abstract feedbackPositionOf(
    workspaceId: string,
    feedbackId: string,
  ): Promise<FeedPosition | null>;

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
