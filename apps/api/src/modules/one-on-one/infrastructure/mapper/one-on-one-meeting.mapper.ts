import type {
  OneOnOneMeeting as MeetingRecord,
  OneOnOneTopic as TopicRecord,
} from '@app/infrastructure/database/generated/client';
import type {
  OneOnOneMeetingProjection,
  OneOnOneTopicProjection,
} from '../../application/types/one-on-one-meeting.types';
import type {
  OneOnOneMeetingSnapshot,
  OneOnOneTopicSnapshot,
} from '../../domain/entity/one-on-one-meeting.entity';
import {
  storedTemplateRef,
  templateColumnsOf,
  templateKeyOf,
  templateRefOf,
} from '../../domain/value-object/one-on-one-template-ref.vo';

/** The only place that knows both the stored meeting rows and the meeting entities. */

type MeetingWithTopics = MeetingRecord & {
  readonly topics: readonly TopicRecord[];
};

/** The columns of a meeting row that a save writes; the timestamps are the store's own. */
type MeetingColumns = Omit<MeetingRecord, 'createdAt' | 'updatedAt'>;

function toTopic(record: TopicRecord): OneOnOneTopicSnapshot {
  return {
    id: record.id,
    text: record.text,
    source: record.source,
    authorAccountId: record.authorAccountId,
    position: record.position,
    notes: record.notes,
    notesUpdatedAt: record.notesUpdatedAt,
    notesUpdatedByAccountId: record.notesUpdatedByAccountId,
    discussedAt: record.discussedAt,
  };
}

function inAgendaOrder(topics: readonly TopicRecord[]): TopicRecord[] {
  return [...topics].sort((a, b) => a.position - b.position);
}

export function toMeetingSnapshot(
  record: MeetingWithTopics,
): OneOnOneMeetingSnapshot {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    oneOnOneId: record.oneOnOneId,
    templateKey: templateKeyOf(storedTemplateRef(record)),
    occursAt: record.occursAt,
    startedAt: record.startedAt,
    startedByAccountId: record.startedByAccountId,
    finishedAt: record.finishedAt,
    finishedByAccountId: record.finishedByAccountId,
    topics: inAgendaOrder(record.topics).map(toTopic),
  };
}

/** A meeting as read for its two people, agenda in order. */
export function toMeetingProjection(
  record: MeetingWithTopics,
): OneOnOneMeetingProjection {
  return {
    id: record.id,
    templateKey: templateKeyOf(storedTemplateRef(record)),
    occursAt: record.occursAt,
    startedAt: record.startedAt,
    startedByAccountId: record.startedByAccountId,
    finishedAt: record.finishedAt,
    finishedByAccountId: record.finishedByAccountId,
    topics: inAgendaOrder(record.topics).map(
      (topic): OneOnOneTopicProjection => toTopic(topic),
    ),
  };
}

/** The meeting row a save writes. */
export function toMeetingRecord(
  snapshot: OneOnOneMeetingSnapshot,
): MeetingColumns {
  return {
    id: snapshot.id,
    workspaceId: snapshot.workspaceId,
    oneOnOneId: snapshot.oneOnOneId,
    ...templateColumnsOf(templateRefOf(snapshot.templateKey)),
    occursAt: snapshot.occursAt,
    startedAt: snapshot.startedAt,
    startedByAccountId: snapshot.startedByAccountId,
    finishedAt: snapshot.finishedAt,
    finishedByAccountId: snapshot.finishedByAccountId,
  };
}

/** The topic rows a save writes: the agenda as it now stands. */
export function toTopicRecords(
  snapshot: OneOnOneMeetingSnapshot,
): TopicRecord[] {
  return snapshot.topics.map((topic) => ({
    ...topic,
    meetingId: snapshot.id,
  }));
}
