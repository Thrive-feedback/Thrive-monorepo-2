import type { FeedbackOrigin } from '../../domain/entity/feedback.entity';
import type { AskStatusValue } from '../../domain/value-object/ask-status.vo';
import type {
  AnswerPostcardSnapshot,
  PostcardSnapshot,
} from '../../domain/value-object/postcard.vo';
import type { VisibilityValue } from '../../domain/value-object/visibility.vo';

/** What a collection route asks for. Declared here, not borrowed from another module. */
export interface PageRequest {
  /** 1-based. */
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Whether a person named on Feedback is still active in its Workspace, or was Deactivated there
 * and is shown as inactive. Their Feedback stays either way (glossary: Deactivate).
 */
export const PERSON_STATUSES = ['ACTIVE', 'DEACTIVATED'] as const;

export type PersonStatus = (typeof PERSON_STATUSES)[number];

/** The people named on one page, as `PeopleService` answers them. */
export interface People {
  /** `null` while they have not introduced themselves, or when their Account is gone. */
  nameOf(accountId: string): string | null;
  /** Their Google photo, or `null` when they have none or their Account is gone. */
  photoOf(accountId: string): string | null;
  statusOf(accountId: string): PersonStatus;
  /** Everything above about one person, as a reader is shown them. */
  personOf(accountId: string): PersonView;
}

/** One person a piece of Feedback names, as a reader is shown them. */
export interface PersonView {
  readonly accountId: string;
  /** `null` while they have not introduced themselves, or when their Account is gone. */
  readonly name: string | null;
  /** `null` when they have no photo. */
  readonly photoUrl: string | null;
  readonly status: PersonStatus;
}

/** What some sent text was bound to, as a reader is shown it. */
export interface TagsView {
  /** In the Admin's spelling, without the `#`. */
  readonly workspaceGoals: readonly { readonly name: string }[];
  /** By the name each Member went by when it was sent. */
  readonly mentions: readonly {
    readonly slug: string;
    readonly displayName: string;
  }[];
}

export interface AnswerView {
  readonly message: string;
  /** What the answer names. */
  readonly tags: TagsView;
  readonly answeredAt: Date;
}

/** One Ask as a screen reads it: who was asked, by name, and where it stands. */
export interface AskView {
  readonly askId: string;
  readonly giverAccountId: string;
  /** `null` while that Member has not introduced themselves. */
  readonly giverName: string | null;
  readonly giverStatus: PersonStatus;
  readonly status: AskStatusValue;
  /**
   * What was written, or `null` — because the Ask is still waiting, because this caller may
   * not read it, or because the view does not carry answers at all, as the list of sent
   * requests does not. The Receiver reads every answer their request collected; a Giver reads
   * their own and nobody else's.
   */
  readonly answer: AnswerView | null;
}

/** A Member a request is shared with, by name. */
export interface SelectedPersonView {
  readonly accountId: string;
  /** `null` while that Member has not introduced themselves. */
  readonly name: string | null;
  readonly status: PersonStatus;
}

/** Who besides the Giver and the Requester reads a request's answers. */
export interface VisibilityView {
  readonly value: VisibilityValue;
  /** Empty unless `value` is Selected people. */
  readonly selectedPeople: readonly SelectedPersonView[];
}

/** One Feedback Request as a screen reads it. */
export interface FeedbackRequestView {
  readonly id: string;
  readonly message: string;
  /** How it looks, or `null` when it was not written on a postcard. */
  readonly postcard: PostcardSnapshot | null;
  readonly tags: TagsView;
  /** `null` when the caller is a Giver, who is not told who else reads it (`ADR-0022`). */
  readonly visibility: VisibilityView | null;
  readonly asks: readonly AskView[];
  readonly createdAt: Date;
}

/** The Requester's own requests, newest first. */
export interface FeedbackRequestListView {
  readonly items: readonly FeedbackRequestView[];
  readonly total: number;
}

/** One Ask as the Member asked reads it: who wants Feedback, about what. */
export interface MyAskView {
  readonly askId: string;
  readonly feedbackRequestId: string;
  readonly message: string;
  readonly tags: TagsView;
  readonly requesterAccountId: string;
  /** `null` while the Requester has not introduced themselves. */
  readonly requesterName: string | null;
  /** `null` when the Requester has no photo. */
  readonly requesterPhotoUrl: string | null;
  readonly requesterStatus: PersonStatus;
  readonly status: AskStatusValue;
  readonly createdAt: Date;
}

/**
 * One Ask as the Member asked opens it to answer: everything the list shows, and whether the
 * answer goes on the Workspace feed — never who else may read it (`ADR-0022`).
 */
export interface OpenedAskView extends MyAskView {
  readonly onWorkspaceFeed: boolean;
}

/** The Asks waiting on one Member, newest first. */
export interface MyAskListView {
  readonly items: readonly MyAskView[];
  readonly total: number;
}

/**
 * One piece of Feedback as one of its Receivers reads it: who wrote it, who else it was for,
 * whether they were asked, and what they wrote. There is no `visibility` here — Visibility
 * governs who *besides* the Giver and the Receivers may read, and a Receiver is never the person
 * it excludes.
 */
export interface ReceivedFeedbackView {
  readonly id: string;
  /** Whether it answered an Ask or was given without being asked. */
  readonly origin: FeedbackOrigin;
  /** The request it answers, or `null` for Feedback given without being asked. */
  readonly feedbackRequestId: string | null;
  readonly giverAccountId: string;
  /** `null` while the Giver has not introduced themselves. */
  readonly giverName: string | null;
  /** `null` when the Giver has no photo. */
  readonly giverPhotoUrl: string | null;
  readonly giverStatus: PersonStatus;
  /** Everyone else it was for, in the order the Giver chose them; empty when only the reader. */
  readonly otherReceivers: readonly PersonView[];
  readonly message: string;
  /** What its Giver's Feedback message names. */
  readonly tags: TagsView;
  readonly createdAt: Date;
}

/**
 * One piece of Feedback, the same for every reader its Visibility lets in: a Receiver, the Giver,
 * or a Member its Visibility reaches — who needs to be told who it is about.
 */
export interface FeedbackView {
  readonly id: string;
  /** Whether it answered an Ask or was given without being asked. */
  readonly origin: FeedbackOrigin;
  /** The request it answers, or `null` for Feedback given without being asked. */
  readonly feedbackRequestId: string | null;
  readonly giverAccountId: string;
  /** `null` while the Giver has not introduced themselves. */
  readonly giverName: string | null;
  /** `null` when the Giver has no photo. */
  readonly giverPhotoUrl: string | null;
  readonly giverStatus: PersonStatus;
  /** Everyone it is for, in the order the Giver chose them: one for Requested Feedback. */
  readonly receivers: readonly PersonView[];
  readonly message: string;
  /** What its Giver's Feedback message names. */
  readonly tags: TagsView;
  readonly createdAt: Date;
}

/** One piece of Feedback opened on its own, with the card it was written on. */
export interface OpenedFeedbackView extends FeedbackView {
  /** How it looks, or `null` when it was not written on a postcard, or is an answer. */
  readonly postcard: PostcardSnapshot | null;
  /** The card an answer is on, or `null` for Feedback given without being asked. */
  readonly request: OpenedRequestView | null;
}

/** One answer on a request's card. */
export interface OpenedAnswerView {
  readonly id: string;
  readonly giver: PersonView;
  readonly message: string;
  readonly tags: TagsView;
  /** What it decided about how it looks, or `null` when it was not written on the card. */
  readonly postcard: AnswerPostcardSnapshot | null;
  readonly answeredAt: Date;
}

/** A request's card, with every answer this reader may read, in the order they were asked. */
export interface OpenedRequestView {
  readonly message: string;
  readonly tags: TagsView;
  readonly requester: PersonView;
  /** How the card looks, or `null` when the request was not written on a postcard. */
  readonly postcard: PostcardSnapshot | null;
  readonly answers: readonly OpenedAnswerView[];
}

/** The Feedback written to one Member, newest first. */
export interface ReceivedFeedbackListView {
  readonly items: readonly ReceivedFeedbackView[];
  readonly total: number;
}

/**
 * The Feedback one Member was selected to read, newest first. Every piece names both people,
 * because the reader is neither of them.
 */
export interface SharedFeedbackListView {
  readonly items: readonly FeedbackView[];
  readonly total: number;
}

/** The request a piece of Requested Feedback answers, with everyone it names. */
export interface AnsweredRequestView {
  readonly message: string;
  /** What the Request message was bound to when it was sent. */
  readonly tags: TagsView;
  readonly requester: PersonView;
  /** Everyone the request asked, in the order they were asked, whatever became of their Ask. */
  readonly asked: readonly PersonView[];
}

/** One piece on the Workspace feed: `request` is `null` for Feedback given without being asked. */
export interface WorkspaceFeedItemView extends FeedbackView {
  readonly request: AnsweredRequestView | null;
}

/**
 * The Feedback of a Workspace that every Member may read, newest first. Every piece names both
 * people: the reader is usually neither of them.
 */
export interface WorkspaceFeedView {
  readonly items: readonly WorkspaceFeedItemView[];
  readonly total: number;
}

/**
 * Which of what a Member reads on Home: everything, what was shown to everyone, or what somebody
 * selected or mentioned them to read.
 */
export const FEED_ITEM_SHOWS = ['ALL', 'EVERYONE', 'SHARED_WITH_ME'] as const;

export type FeedItemShow = (typeof FEED_ITEM_SHOWS)[number];

/** The only Visibilities Home holds: Only me is read in the history of those it is about. */
export const FEED_ITEM_VISIBILITIES = ['EVERYONE', 'SELECTED_PEOPLE'] as const;

export type FeedItemVisibility = (typeof FEED_ITEM_VISIBILITIES)[number];

/** One person a request on Home asked, where their Ask stands, and what they wrote once they have. */
export interface FeedItemAskView {
  readonly person: PersonView;
  readonly status: AskStatusValue;
  readonly answer: AnswerView | null;
}

/**
 * The request an answer on Home responds to, with everyone it asked. Whoever may read the answer
 * reads all of this: every answer takes the request's one Visibility, so the reader may read the
 * others too (brain `ADR-0050`).
 */
export interface FeedItemRequestView {
  readonly message: string;
  /** What the Request message was bound to when it was sent. */
  readonly tags: TagsView;
  readonly requester: PersonView;
  /** In the order they were asked, the Giver of this answer among them. */
  readonly asked: readonly FeedItemAskView[];
}

/** One piece on Home: `request` is `null` for Feedback given without being asked. */
export interface FeedItemView extends FeedbackView {
  readonly visibility: FeedItemVisibility;
  readonly request: FeedItemRequestView | null;
}

/** One page of what a Member reads on Home, newest first. */
export interface FeedItemsView {
  readonly items: readonly FeedItemView[];
  /** The id the next page starts after, or `null` on the last page. */
  readonly nextAfterId: string | null;
}
