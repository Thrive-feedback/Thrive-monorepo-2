import type { MeetingPeople } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/meeting-summary';
import type {
  Meeting,
  MeetingContextCard,
  MeetingContextLookback,
  MeetingContextTab,
  ProfileItem,
  TopicBroughtFrom,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import {
  dayInBangkok,
  daysBefore,
  startOfDayInBangkok,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-schedule.util';
import { TEXT_TAG_RULES } from '@/lib/feedback/text-tag-rules.constant';
import type { TextTags } from '@/lib/feedback/text-tags.type';
import { segmentsOf, tagKeyOf } from '@/lib/tag-text.util';

/** How long a topic may be, as the API holds it: what a topic brought from a card keeps fits in it. */
const TOPIC_LENGTH = 200;

const MS_IN_A_DAY = 24 * 60 * 60 * 1000;

/** The two parts the tabs sit in, in the order a Profile draws them (brain ADR-0063). */
export const MEETING_CONTEXT_GROUPS: readonly {
  readonly label: string;
  readonly tabs: readonly MeetingContextTab[];
}[] = [
  { label: 'Everyone sees', tabs: ['FEEDBACK', 'KUDOS'] },
  { label: 'For you', tabs: ['BETWEEN', 'SHARED', 'OPEN_ASKS'] },
];

/** Every tab, in the order they read. */
export const MEETING_CONTEXT_TABS: readonly MeetingContextTab[] =
  MEETING_CONTEXT_GROUPS.flatMap((group) => group.tabs);

/** Which list of the other person's Profile each tab reads (brain ADR-0063, ADR 0097). */
export const PROFILE_SHOW_OF: Readonly<
  Record<
    MeetingContextTab,
    'FEEDBACK' | 'KUDOS' | 'BETWEEN_US' | 'SHARED_WITH_ME' | 'OPEN_ASKS'
  >
> = {
  FEEDBACK: 'FEEDBACK',
  KUDOS: 'KUDOS',
  BETWEEN: 'BETWEEN_US',
  SHARED: 'SHARED_WITH_ME',
  OPEN_ASKS: 'OPEN_ASKS',
};

/** How far back a first meeting looks, before any meeting was held (brain ADR-0063). */
const FIRST_LOOKBACK_DAYS = 30;

/**
 * From when Before you meet reads: when the last meeting held began, or the start of the day 30 days
 * before today on the schedule's clock while none was held. A skipped day has no meeting, so it never
 * moves it.
 */
export function contextWindowOf(
  past: readonly Meeting[],
  today: string,
): { readonly since: string; readonly lookback: MeetingContextLookback } {
  const lastHeld = past
    .map((meeting) => meeting.startedAt)
    .filter((startedAt): startedAt is string => startedAt !== null)
    .sort()
    .at(-1);
  if (lastHeld) {
    return { since: lastHeld, lookback: 'LAST_MEETING' };
  }
  return {
    since: startOfDayInBangkok(daysBefore(today, FIRST_LOOKBACK_DAYS)),
    lookback: 'FIRST_30_DAYS',
  };
}

/** One item of the other person's Profile, as a card read before a meeting. */
export function toContextCard(item: ProfileItem): MeetingContextCard {
  switch (item.kind) {
    case 'ASK':
      return {
        kind: 'ASK',
        id: item.id,
        requester: item.requester,
        askedAccountId: item.asked.accountId,
        question: item.message,
        messageTags: item.tags,
        askedAt: item.createdAt,
      };
    case 'KUDOS':
      return {
        kind: 'KUDOS',
        id: item.id,
        giver: item.giver,
        recipientAccountIds: item.recipients.map((person) => person.accountId),
        message: item.message,
        messageTags: item.tags,
        writtenAt: item.createdAt,
      };
    default:
      return {
        kind: 'FEEDBACK',
        id: item.id,
        giver: item.giver,
        receiverAccountIds: item.receivers.map((person) => person.accountId),
        message: item.message,
        messageTags: item.tags,
        question: item.request?.message ?? null,
        writtenAt: item.createdAt,
      };
  }
}

/** The first word of a name, as a sentence names somebody; "Someone" for a name not yet given. */
export function firstNameOf(name: string | null): string {
  return name?.trim().split(/\s+/)[0] || 'Someone';
}

/**
 * Whose words a line is in: the reader's own, "you" for themselves, as a card reads; or both
 * people's, each by first name, as a topic on the agenda the two share must read for either.
 */
export type WhoVoice = 'reader' | 'shared';

/** How a line names somebody: the reader, the other person by name, or anyone else by first name. */
function nameIn(
  people: MeetingPeople,
  accountId: string,
  name: string | null,
  voice: WhoVoice,
): string {
  if (accountId === people.readerAccountId) {
    return voice === 'reader' ? 'You' : people.readerName;
  }
  return accountId === people.otherAccountId
    ? people.otherName
    : firstNameOf(name);
}

/** One piece of a card's opening line: a person, set to stand out, or the words between them. */
export type WhoPart = { readonly text: string; readonly isName: boolean };

const name = (text: string): WhoPart => ({ text, isName: true });
const words = (text: string): WhoPart => ({ text, isName: false });

/**
 * Who it is from and to, in parts so the people stand out from the words between them. In the
 * reader's voice: "Ploy sent to Mint", "You sent to Mint", "Mint sent to you", "Nok sent to you, Mint
 * and 3 others", "Mint asked you for feedback". In the shared voice the reader is named as the other
 * person would name them: "Zen sent to Mint", "Mint asked Zen for feedback".
 */
export function whoPartsOf(
  card: MeetingContextCard,
  people: MeetingPeople,
  voice: WhoVoice = 'reader',
): readonly WhoPart[] {
  const reader = voice === 'reader' ? 'you' : people.readerName;
  if (card.kind === 'ASK') {
    return card.requester.accountId === people.readerAccountId
      ? [
          name(voice === 'reader' ? 'You' : people.readerName),
          words(' asked '),
          name(people.otherName),
          words(' for feedback'),
        ]
      : [
          name(people.otherName),
          words(' asked '),
          name(reader),
          words(' for feedback'),
        ];
  }
  const from = nameIn(people, card.giver.accountId, card.giver.name, voice);
  const to =
    card.kind === 'FEEDBACK'
      ? card.receiverAccountIds
      : card.recipientAccountIds;
  const others = to.filter(
    (accountId) =>
      accountId !== people.readerAccountId &&
      accountId !== people.otherAccountId &&
      accountId !== card.giver.accountId,
  ).length;
  const named = [
    ...(to.includes(people.readerAccountId) &&
    card.giver.accountId !== people.readerAccountId
      ? [reader]
      : []),
    ...(to.includes(people.otherAccountId) &&
    card.giver.accountId !== people.otherAccountId
      ? [people.otherName]
      : []),
    ...(others > 0 ? [others === 1 ? '1 other' : `${others} others`] : []),
  ];
  const list = named.flatMap((each, index) => [
    ...(index === 0
      ? []
      : [words(index === named.length - 1 ? ' and ' : ', ')]),
    name(each),
  ]);
  return [name(from), words(' sent to '), ...list];
}

/** The opening line as one sentence, in the reader's voice unless told otherwise. */
export function whoOf(
  card: MeetingContextCard,
  people: MeetingPeople,
  voice: WhoVoice = 'reader',
): string {
  return whoPartsOf(card, people, voice)
    .map((part) => part.text)
    .join('');
}

/** Whole days an Ask has waited, by the schedule's calendar days of `today` and when it was asked. */
export function waitingDaysOf(askedAt: string, today: string): number {
  const asked = Date.parse(`${dayInBangkok(askedAt)}T00:00:00.000Z`);
  const now = Date.parse(`${today}T00:00:00.000Z`);
  return Math.max(0, Math.round((now - asked) / MS_IN_A_DAY));
}

/** The words on one line however they were written, cut at a word's end to fit `length`. */
function excerptOf(message: string, length: number): string {
  const line = message.replace(/\s+/g, ' ').trim();
  if (line.length <= length) {
    return line;
  }
  const cut = line.slice(0, length - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > length / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * The words with each Member they mention by first name, `@Ben` for `@ben-carter`: a topic is plain
 * text, with no tags to read a slug back into a name, and the agenda draws `@Ben` as a mention.
 */
function mentionsByName(text: string, tags: TextTags): string {
  const names = new Map(
    tags.mentions.map((mention) => [
      tagKeyOf(mention.slug),
      firstNameOf(mention.displayName),
    ]),
  );
  return segmentsOf(text, TEXT_TAG_RULES)
    .map((segment) => {
      const name =
        segment.kind === 'tag' && segment.char === '@'
          ? names.get(segment.key)
          : undefined;
      return name ? `@${name}` : segment.text;
    })
    .join('');
}

/**
 * The topic a card becomes when it is brought onto the agenda: who it is from and to, and what it
 * said, cut to a line. It is stored once and both people read it, so it names both by first name,
 * never "you"; the agenda says beside it whether it came from Feedback or Kudos.
 */
export function topicFromContext(
  card: MeetingContextCard,
  people: MeetingPeople,
): string {
  const words = mentionsByName(
    card.kind === 'ASK' ? card.question : card.message,
    card.messageTags,
  );
  const who = `${whoOf(card, people, 'shared')}: `;
  // As much of the words as a topic holds: the agenda shows a brought topic whole.
  return `${who}${excerptOf(words, TOPIC_LENGTH - who.length)}`;
}

/** What a topic brought from a card names: the item of the other person's Profile it came from. */
export function broughtFromOf(card: MeetingContextCard): TopicBroughtFrom {
  return { kind: card.kind, id: card.id };
}

/** One key per source, so what is on the agenda and what is read can be matched. */
export function sourceKeyOf(source: TopicBroughtFrom): string {
  return `${source.kind}:${source.id}`;
}
