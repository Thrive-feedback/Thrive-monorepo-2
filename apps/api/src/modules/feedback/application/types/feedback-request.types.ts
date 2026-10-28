import type { FeedbackOrigin } from '../../domain/entity/feedback.entity';
import type { AskStatusValue } from '../../domain/value-object/ask-status.vo';
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
  /** `null` when that Member has no photo. */
  readonly giverPhotoUrl: string | null;
  readonly giverStatus: PersonStatus;
  readonly status: AskStatusValue;
  /**
   * What was written, or `null` — because the Ask is still waiting, or because this caller may
   * not read it. The Receiver reads every answer their request collected; a Giver reads their own
   * and nobody else's.
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
  /**
   * Whether the answer goes on the Workspace feed — never who else may read it (`ADR-0022`,
   * `ADR-0046` in the brain).
   */
  readonly onWorkspaceFeed: boolean;
  readonly createdAt: Date;
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
  /** The request it answers, or `null` for Feedback given without being asked. */
  readonly request: AnsweredRequestView | null;
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
  readonly items: readonly FeedbackWithRequestView[];
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

/**
 * One piece of Feedback with the request it answers, as the Workspace feed and Shared with me show
 * it: `request` is `null` for Feedback given without being asked.
 */
export interface FeedbackWithRequestView extends FeedbackView {
  readonly request: AnsweredRequestView | null;
}

/**
 * The Feedback of a Workspace that every Member may read, newest first. Every piece names both
 * people: the reader is usually neither of them.
 */
export interface WorkspaceFeedView {
  readonly items: readonly FeedbackWithRequestView[];
  readonly total: number;
}
