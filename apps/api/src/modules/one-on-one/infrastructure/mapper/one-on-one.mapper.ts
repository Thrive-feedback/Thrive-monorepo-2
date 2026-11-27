import type { OneOnOne as OneOnOneRecord } from '@app/infrastructure/database/generated/client';
import type { OneOnOneRow } from '../../application/types/one-on-one.types';
import { OneOnOne } from '../../domain/entity/one-on-one.entity';
import {
  OneOnOneSchedule,
  type OneOnOneScheduleSnapshot,
} from '../../domain/value-object/one-on-one-schedule.vo';
import { OneOnOneStatus } from '../../domain/value-object/one-on-one-status.vo';
import {
  storedTemplateRef,
  templateColumnsOf,
  templateKeyOf,
  templateRefOf,
} from '../../domain/value-object/one-on-one-template-ref.vo';
import { ThriveTemplate } from '../../domain/value-object/thrive-template.vo';
import {
  inProgressOf,
  lastFinishedOf,
  type StartedMeetings,
} from '../query/meeting-in-progress.record';

/** The only place that knows both the stored row and the 1:1 entity. */

type ScheduleColumns = Pick<
  OneOnOneRecord,
  'cadence' | 'weekday' | 'startsOn' | 'templateKey' | 'templateId'
>;

/** A calendar day is stored as a date, which Prisma reads as midnight UTC of that day. */
function dayToDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

function dateToDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Every 1:1 is sent with when it meets, so its schedule columns are always set. */
export function toScheduleSnapshot(
  record: ScheduleColumns,
): OneOnOneScheduleSnapshot {
  return {
    cadence: record.cadence,
    weekday: record.weekday,
    templateKey: templateKeyOf(storedTemplateRef(record)),
    startsOn: dateToDay(record.startsOn),
  };
}

/** The audit timestamps are the database's to set. */
export function toOneOnOneRecord(
  oneOnOne: OneOnOne,
): Omit<OneOnOneRecord, 'createdAt' | 'updatedAt'> {
  const snapshot = oneOnOne.snapshot();
  const schedule = snapshot.schedule;
  return {
    id: snapshot.id,
    workspaceId: snapshot.workspaceId,
    startedByAccountId: snapshot.startedByAccountId,
    invitedAccountId: snapshot.invitedAccountId,
    status: snapshot.status,
    cadence: schedule.cadence,
    weekday: schedule.weekday,
    startsOn: dayToDate(schedule.startsOn),
    ...templateColumnsOf(templateRefOf(schedule.templateKey)),
    inviteNote: snapshot.inviteNote,
    suggestedAt: snapshot.suggestedAt,
    answerNote: snapshot.answerNote,
    answeredAt: snapshot.answeredAt,
    endedAt: snapshot.endedAt,
    skippedDays: [...snapshot.skippedDays],
  };
}

export function toOneOnOne(record: OneOnOneRecord): OneOnOne {
  return OneOnOne.restore({
    id: record.id,
    workspaceId: record.workspaceId,
    startedByAccountId: record.startedByAccountId,
    invitedAccountId: record.invitedAccountId,
    status: OneOnOneStatus.of(record.status),
    schedule: OneOnOneSchedule.restore(toScheduleSnapshot(record)),
    inviteNote: record.inviteNote,
    suggestedAt: record.suggestedAt,
    answerNote: record.answerNote,
    answeredAt: record.answeredAt,
    endedAt: record.endedAt,
    skippedDays: record.skippedDays,
  });
}

/** A kept template's foreign key means it is always read with the 1:1; one missing is a bug. */
function keptTemplateName(template: { readonly name: string } | null): string {
  if (template === null) {
    throw new Error('A 1:1 names a kept template it was not read with.');
  }
  return template.name;
}

/**
 * A 1:1 as its reader is shown it, read with its meeting in progress and, for one starting from a
 * kept template, that template's name (`ONE_ON_ONE_ROW`). Thrive's own are named from code.
 */
export function toOneOnOneRow(
  record: OneOnOneRecord & {
    readonly meetings: StartedMeetings;
    readonly template: { readonly name: string } | null;
  },
): OneOnOneRow {
  const ref = storedTemplateRef(record);
  return {
    id: record.id,
    status: record.status,
    startedByAccountId: record.startedByAccountId,
    invitedAccountId: record.invitedAccountId,
    schedule: toScheduleSnapshot(record),
    templateName:
      ref.kind === 'THRIVE'
        ? ThriveTemplate.of(ref.key).snapshot().name
        : keptTemplateName(record.template),
    inviteNote: record.inviteNote,
    suggestedAt: record.suggestedAt,
    answerNote: record.answerNote,
    answeredAt: record.answeredAt,
    endedAt: record.endedAt,
    createdAt: record.createdAt,
    meetingInProgress: inProgressOf(record.meetings) !== null,
    meetingInProgressFor: inProgressOf(record.meetings)?.occursAt ?? null,
    hasFinishedMeeting: lastFinishedOf(record.meetings) !== null,
    lastHeldFor: lastFinishedOf(record.meetings)?.occursAt ?? null,
    skippedDays: record.skippedDays,
  };
}
