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

/** A template named by two columns as the wire carries it; `null` when neither is set. */
function templateKeyOfColumns(record: {
  readonly templateKey: string | null;
  readonly templateId: string | null;
}): string | null {
  return record.templateKey === null && record.templateId === null
    ? null
    : templateKeyOf(storedTemplateRef(record));
}

/**
 * One topic as the domain holds it. A topic from a template names the template that asked it; one
 * stored before topics named theirs names neither, and is read as the meeting's, the only template
 * an agenda could take then (ADR 0099).
 */
function toTopic(
  record: TopicRecord,
  meetingTemplateKey: string | null,
): OneOnOneTopicSnapshot {
  const ownTemplateKey = templateKeyOfColumns(record);
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
    addedAt: record.addedAt,
    carriedFrom: record.carriedFrom,
    broughtFrom:
      record.broughtFromKind === null || record.broughtFromId === null
        ? null
        : { kind: record.broughtFromKind, id: record.broughtFromId },
    templateKey:
      record.source === 'TEMPLATE'
        ? (ownTemplateKey ?? meetingTemplateKey)
        : ownTemplateKey,
  };
}

/** The meeting's template, used last, as the wire carries it; `null` when nobody used one for it. */
function meetingTemplateKeyOf(record: {
  readonly templateKey: string | null;
  readonly templateId: string | null;
}): string | null {
  return templateKeyOfColumns(record);
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
    templateKey: meetingTemplateKeyOf(record),
    occursAt: record.occursAt,
    startedAt: record.startedAt,
    startedByAccountId: record.startedByAccountId,
    finishedAt: record.finishedAt,
    finishedByAccountId: record.finishedByAccountId,
    topics: inAgendaOrder(record.topics).map((topic) =>
      toTopic(topic, meetingTemplateKeyOf(record)),
    ),
  };
}

/** A meeting as read for its two people, agenda in order. */
export function toMeetingProjection(
  record: MeetingWithTopics,
): OneOnOneMeetingProjection {
  return {
    id: record.id,
    templateKey: meetingTemplateKeyOf(record),
    occursAt: record.occursAt,
    startedAt: record.startedAt,
    startedByAccountId: record.startedByAccountId,
    finishedAt: record.finishedAt,
    finishedByAccountId: record.finishedByAccountId,
    topics: inAgendaOrder(record.topics).map(
      (topic): OneOnOneTopicProjection =>
        toTopic(topic, meetingTemplateKeyOf(record)),
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
    ...(snapshot.templateKey === null
      ? { templateKey: null, templateId: null }
      : templateColumnsOf(templateRefOf(snapshot.templateKey))),
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
  return snapshot.topics.map(({ broughtFrom, templateKey, ...topic }) => ({
    ...topic,
    meetingId: snapshot.id,
    broughtFromKind: broughtFrom?.kind ?? null,
    broughtFromId: broughtFrom?.id ?? null,
    ...(templateKey === null
      ? { templateKey: null, templateId: null }
      : templateColumnsOf(templateRefOf(templateKey))),
  }));
}
