import type { components } from '@repo/api';
import type { TextTags } from '@/lib/feedback/text-tags.type';

/** A 1:1's next meeting as the API answers it: the live one, or what it will open with. */
export type NextMeeting =
  components['schemas']['NextMeetingResponseDto_Output'];

/** One meeting of a 1:1: its topics and the note both write on each. */
export type Meeting = NonNullable<NextMeeting['meeting']>;

export type MeetingTopic = Meeting['topics'][number];

/** One page of a list on the other person's Profile, as the API answers it. */
export type ProfileItemsPage =
  components['schemas']['ListProfileItemsResponseDto_Output'];

export type ProfileItem = ProfileItemsPage['items'][number];

/** Where a topic was brought from, when a person brought it from the other person's Profile. */
export type TopicBroughtFrom = NonNullable<MeetingTopic['broughtFrom']>;

/**
 * The tabs read before a meeting, the same as a Profile's (brain ADR-0063): what everyone sees about
 * the other person (Feedback, Kudos), and what is for the reader (Between you two, Shared with you,
 * Open asks).
 */
export type MeetingContextTab =
  | 'FEEDBACK'
  | 'KUDOS'
  | 'BETWEEN'
  | 'SHARED'
  | 'OPEN_ASKS';

/** Somebody a card names, as the reader is shown them. */
export type MeetingContextPerson = {
  readonly accountId: string;
  /** `null` while they have not introduced themselves, or when their Account is gone. */
  readonly name: string | null;
  readonly photoUrl: string | null;
};

/** One card read before a meeting: a piece of Feedback, a Kudos, or an Ask still waiting. */
export type MeetingContextCard =
  | {
      readonly kind: 'FEEDBACK';
      readonly id: string;
      readonly giver: MeetingContextPerson;
      /** Everyone it was written to. */
      readonly receiverAccountIds: readonly string[];
      readonly message: string;
      /** What its words were bound to: Workspace Goals and Mentions, drawn as pills. */
      readonly messageTags: TextTags;
      /** The question it answers, or `null` for Feedback given unasked. */
      readonly question: string | null;
      readonly writtenAt: string;
    }
  | {
      readonly kind: 'KUDOS';
      readonly id: string;
      readonly giver: MeetingContextPerson;
      /** Everyone it names. */
      readonly recipientAccountIds: readonly string[];
      readonly message: string;
      readonly messageTags: TextTags;
      readonly writtenAt: string;
    }
  | {
      readonly kind: 'ASK';
      readonly id: string;
      readonly requester: MeetingContextPerson;
      /** Who was asked and has not answered. */
      readonly askedAccountId: string;
      /** What was asked. */
      readonly question: string;
      readonly messageTags: TextTags;
      readonly askedAt: string;
    };

/** One tab's batch: what was read, how many it holds for the period, and where the next starts. */
export type MeetingContextTabView = {
  readonly items: readonly MeetingContextCard[];
  readonly count: number;
  /** Where the next batch starts, or `null` when this one holds the last. */
  readonly nextCursor: string | null;
};

/** Where what is read before a meeting starts: the last meeting held, or 30 days back before the first. */
export type MeetingContextLookback = 'LAST_MEETING' | 'FIRST_30_DAYS';

/**
 * What is read before the next meeting, by tab. Every tab but Open asks holds what was written since
 * `since`; Open asks holds every Ask still waiting, however old.
 */
export type MeetingContextView = {
  readonly since: string;
  readonly lookback: MeetingContextLookback;
  readonly tabs: Readonly<Record<MeetingContextTab, MeetingContextTabView>>;
};

/**
 * What the 1:1s page reads for a running 1:1's panel: the next meeting, those finished, the meeting
 * days skipped (`YYYY-MM-DD`, oldest first), and what the templates their topics came from are called.
 */
export type OneOnOneMeetings = {
  readonly next: NextMeeting;
  readonly past: readonly Meeting[];
  readonly skippedDays: readonly string[];
  /** What each template a topic of the past meetings came from is called. */
  readonly pastTemplates: readonly TemplateName[];
  /** What is read before the next meeting, by tab; absent where it is not read, as for a 1:1 that is over. */
  readonly context?: MeetingContextView;
};

/** A template a topic came from, by its key, with what it is called. */
export type TemplateName = NextMeeting['templates'][number];
