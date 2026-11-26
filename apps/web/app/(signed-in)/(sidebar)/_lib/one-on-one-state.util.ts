import type { OneOnOne } from './one-on-one.type';

/** Whether the reader sent the invitation; the other person did otherwise. */
export function startedByReader(oneOnOne: OneOnOne): boolean {
  return oneOnOne.startedByAccountId !== oneOnOne.withAccountId;
}

/** Whether it is an invitation waiting on the reader's answer, sent first or sent back. */
export function awaitsReadersAnswer(oneOnOne: OneOnOne): boolean {
  return oneOnOne.status === 'INVITED' && !startedByReader(oneOnOne);
}

/** Whether it was sent back with another time; whoever sent it back is now its sender. */
export function wasSuggested(oneOnOne: OneOnOne): boolean {
  return oneOnOne.suggestedAt !== null;
}

/** Whether it is held just once rather than on a repeat. */
export function isOnce(oneOnOne: OneOnOne): boolean {
  return oneOnOne.schedule.cadence === 'ONCE';
}

/**
 * Whether it was a meeting held just once and that meeting is over: it still runs in the API's
 * terms, but has no next meeting, so it belongs with what is past. While its meeting is started and
 * not finished it is not over, though its slot has passed: the two can still note and finish it.
 */
export function isMet(oneOnOne: OneOnOne): boolean {
  return (
    oneOnOne.status === 'ACTIVE' &&
    isOnce(oneOnOne) &&
    oneOnOne.nextMeetingAt === null &&
    !oneOnOne.meetingInProgress
  );
}

/** Where a 1:1 stands for its reader, in the order the page lists them. */
export type OneOnOneGroup =
  | 'answer'
  | 'running'
  | 'waiting'
  | 'declined'
  | 'past';

export const ONE_ON_ONE_GROUPS: readonly OneOnOneGroup[] = [
  'answer',
  'running',
  'waiting',
  'declined',
  'past',
];

export function groupOf(oneOnOne: OneOnOne): OneOnOneGroup {
  switch (oneOnOne.status) {
    case 'ACTIVE':
      return isMet(oneOnOne) ? 'past' : 'running';
    case 'DECLINED':
      return 'declined';
    case 'ENDED':
      return 'past';
    default:
      return awaitsReadersAnswer(oneOnOne) ? 'answer' : 'waiting';
  }
}

/**
 * The tabs the list is read in. **Upcoming** is where a person spends their time: what meets, on a
 * repeat or once. **Pending** is the few that wait on an answer, theirs or the other person's.
 * **History** is what was turned down or is over, which is rarely looked at.
 */
export type OneOnOneTab = 'upcoming' | 'pending' | 'history';

export const ONE_ON_ONE_TABS: Readonly<
  Record<OneOnOneTab, readonly OneOnOneGroup[]>
> = {
  upcoming: ['running'],
  pending: ['answer', 'waiting'],
  history: ['declined', 'past'],
};

export function tabOf(oneOnOne: OneOnOne): OneOnOneTab {
  const group = groupOf(oneOnOne);
  if (ONE_ON_ONE_TABS.pending.includes(group)) {
    return 'pending';
  }
  return ONE_ON_ONE_TABS.history.includes(group) ? 'history' : 'upcoming';
}

/**
 * The reader's 1:1s in the order the page lists them: what waits on their answer first, then what
 * runs, soonest meeting first, then what waits on somebody else, then what was turned down, then
 * what has ended, most recently ended first.
 */
export function inListOrder(
  oneOnOnes: readonly OneOnOne[],
): readonly OneOnOne[] {
  const rank = (oneOnOne: OneOnOne) =>
    ONE_ON_ONE_GROUPS.indexOf(groupOf(oneOnOne));
  const when = (oneOnOne: OneOnOne) => {
    // A met once-only 1:1 is still ACTIVE, so it is asked first: it is past, most recent first.
    if (isMet(oneOnOne)) {
      return -Date.parse(`${oneOnOne.schedule.startsOn}T00:00:00.000Z`);
    }
    if (oneOnOne.status === 'ACTIVE') {
      return oneOnOne.nextMeetingAt ? Date.parse(oneOnOne.nextMeetingAt) : 0;
    }
    if (oneOnOne.status === 'ENDED') {
      return -(oneOnOne.endedAt ? Date.parse(oneOnOne.endedAt) : 0);
    }
    return Date.parse(oneOnOne.createdAt);
  };
  return [...oneOnOnes].sort((a, b) => rank(a) - rank(b) || when(a) - when(b));
}
