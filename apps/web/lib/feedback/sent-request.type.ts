import type { AskStatus } from './ask-status.constant';
import type { TextTags } from './text-tags.type';

/** What somebody asked wrote back, as the person who asked reads it. */
export type SentAnswer = {
  /** Their Feedback message, as they wrote it — line breaks and all. */
  readonly message: string;
  /** What the answer was bound to: only what its Giver wrote. */
  readonly messageTags: TextTags;
  /** ISO 8601, formatted where it is shown. */
  readonly answeredAt: string;
};

export type SentAsk = {
  readonly askId: string;
  /** The Member asked, by the name on their Profile, or `null` while they have none. */
  readonly giverName: string | null;
  /** Their Google photo, or `null` when they have none. */
  readonly giverPhotoUrl: string | null;
  /** Deactivated in this Workspace, so shown as inactive; what they wrote stays. */
  readonly giverInactive: boolean;
  readonly status: AskStatus;
  /** What they wrote, once they have; `null` while the Ask waits or after it expired. */
  readonly answer: SentAnswer | null;
};

/** Who besides the person who asked reads the answers, in the words of the form that sent it. */
export type SentRequestReaders = {
  readonly value: 'ONLY_ME' | 'SELECTED_PEOPLE' | 'EVERYONE';
  /** The people selected, in order; empty unless `value` is Selected people. */
  readonly selectedPeople: readonly {
    /** `null` for a Member who has not introduced themselves. */
    readonly name: string | null;
    /** Deactivated in this Workspace, so shown as inactive. */
    readonly inactive: boolean;
  }[];
};

export type SentRequest = {
  readonly id: string;
  /** The Request message. */
  readonly message: string;
  /** What the Request message was bound to when the request was sent. */
  readonly messageTags: TextTags;
  /** ISO 8601, formatted where it is shown. */
  readonly sentAt: string;
  /** Everyone asked, in the order they were asked, each with where their Ask stands. */
  readonly asks: readonly SentAsk[];
  /**
   * Who reads the answers. The API tells the person who asked every time; `null` would mean it
   * did not, and then nothing is said.
   */
  readonly readers: SentRequestReaders | null;
};
