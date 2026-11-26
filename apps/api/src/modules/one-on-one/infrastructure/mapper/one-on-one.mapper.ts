import type { OneOnOne as OneOnOneRecord } from '@app/infrastructure/database/generated/client';
import type { OneOnOneRow } from '../../application/types/one-on-one.types';
import { OneOnOne } from '../../domain/entity/one-on-one.entity';
import {
  OneOnOneSchedule,
  type OneOnOneScheduleSnapshot,
} from '../../domain/value-object/one-on-one-schedule.vo';
import { OneOnOneStatus } from '../../domain/value-object/one-on-one-status.vo';

/** The only place that knows both the stored row and the 1:1 entity. */

type ScheduleColumns = Pick<
  OneOnOneRecord,
  | 'cadence'
  | 'weekday'
  | 'startMinute'
  | 'lengthMinutes'
  | 'startsOn'
  | 'templateKey'
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
    startMinute: record.startMinute,
    lengthMinutes: record.lengthMinutes,
    templateKey: record.templateKey,
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
    startMinute: schedule.startMinute,
    lengthMinutes: schedule.lengthMinutes,
    startsOn: dayToDate(schedule.startsOn),
    templateKey: schedule.templateKey,
    inviteNote: snapshot.inviteNote,
    suggestedAt: snapshot.suggestedAt,
    answerNote: snapshot.answerNote,
    answeredAt: snapshot.answeredAt,
    endedAt: snapshot.endedAt,
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
  });
}

export function toOneOnOneRow(
  record: OneOnOneRecord & { readonly meetings: readonly { id: string }[] },
): OneOnOneRow {
  return {
    id: record.id,
    status: record.status,
    startedByAccountId: record.startedByAccountId,
    invitedAccountId: record.invitedAccountId,
    schedule: toScheduleSnapshot(record),
    inviteNote: record.inviteNote,
    suggestedAt: record.suggestedAt,
    answerNote: record.answerNote,
    answeredAt: record.answeredAt,
    endedAt: record.endedAt,
    createdAt: record.createdAt,
    meetingInProgress: record.meetings.length > 0,
  };
}
