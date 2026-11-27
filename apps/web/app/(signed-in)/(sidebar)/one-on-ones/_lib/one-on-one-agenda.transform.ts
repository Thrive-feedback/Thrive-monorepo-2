import type {
  MeetingTopic,
  NextMeeting,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';

/** One line of the next meeting's agenda as the panel draws it. */
export type AgendaTopic = {
  /** The topic's id once the meeting is open; before then, its place in the preview. */
  readonly key: string;
  readonly text: string;
  readonly source: MeetingTopic['source'];
  readonly authorAccountId: string | null;
  /** The stored topic, once the meeting is open: what its note and tick are written to. */
  readonly topic: MeetingTopic | null;
};

/**
 * The next meeting's agenda, the same shape before and after anybody writes to it: the open
 * meeting's topics in order, or, before then, what it will open with — what was not reached last
 * time — keyed by place.
 */
export function agendaOf(next: NextMeeting): readonly AgendaTopic[] {
  if (next.meeting) {
    return next.meeting.topics.map((topic) => ({
      key: topic.id,
      text: topic.text,
      source: topic.source,
      authorAccountId: topic.authorAccountId,
      topic,
    }));
  }
  return next.carried.map((text, position) => ({
    key: `preview-${position}`,
    text,
    source: 'CARRIED' as const,
    authorAccountId: null,
    topic: null,
  }));
}
