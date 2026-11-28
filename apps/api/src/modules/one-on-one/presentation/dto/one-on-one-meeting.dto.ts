import {
  cursorQueryShape,
  cursorResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** A nullable string described by hand, as `one-on-one.dto.ts` explains. */
function nullableString() {
  return z.string().nullable().meta({ type: 'string', nullable: true });
}

/** A nullable RFC 3339 instant, described by hand for the same reason. */
function nullableDateTime() {
  return z.iso
    .datetime({ offset: true })
    .nullable()
    .meta({ type: 'string', format: 'date-time', nullable: true });
}

export const meetingPathParamsSchema = z.object({
  workspaceId: z.uuid(),
  oneOnOneId: z.uuid(),
  meetingId: z.uuid(),
});
export class MeetingPathParamsDto extends createZodDto(
  meetingPathParamsSchema,
) {}

export const topicPathParamsSchema = meetingPathParamsSchema.extend({
  topicId: z.uuid(),
});
export class TopicPathParamsDto extends createZodDto(topicPathParamsSchema) {}

export const meetingTemplatePathParamsSchema = meetingPathParamsSchema.extend({
  /** One of Thrive's template keys, or the id of a kept template, as `topics[].templateKey` names it. */
  templateKey: z.string().min(1),
});
export class MeetingTemplatePathParamsDto extends createZodDto(
  meetingTemplatePathParamsSchema,
) {}

/** An item of the other person's Profile, read through `GET …/members/{accountId}/profile-items`. */
const broughtFromSchema = z.object({
  kind: z.enum(['FEEDBACK', 'KUDOS', 'ASK']),
  id: z.uuid(),
});

export const addTopicRequestSchema = z.strictObject({
  /** At most 200 characters. */
  text: z.string(),
  /**
   * The item of the other person's Profile it is brought from: a piece of Feedback, a Kudos, or an
   * Ask still open between the two. Refused with `ONE_ON_ONE_TOPIC_SOURCE_NOT_FOUND` when it is not
   * on that Profile for the caller, and with `ONE_ON_ONE_TOPIC_ALREADY_ON_AGENDA` when it is on this
   * agenda already.
   */
  broughtFrom: broughtFromSchema.optional(),
});
export class AddTopicRequestDto extends createZodDto(addTopicRequestSchema) {}

export const updateTopicRequestSchema = z
  .strictObject({
    /** A new wording: the author's, or anyone's for a template or carried topic. */
    text: z.string().optional(),
    /** The shared note, at most 4,000 characters. Only while the meeting runs. */
    note: z.string().optional(),
    /**
     * When the caller last read the note (`notesUpdatedAt` as they saw it), with `note`. If the other
     * person wrote it since, the write is refused with `ONE_ON_ONE_TOPIC_CHANGED`.
     */
    noteReadAt: z.iso.datetime({ offset: true }).nullable().optional(),
    discussed: z.boolean().optional(),
  })
  .refine(
    (change) =>
      change.text !== undefined ||
      change.note !== undefined ||
      change.discussed !== undefined,
    { message: 'Change the wording, the note or the discussed tick.' },
  )
  .refine(
    (change) => change.noteReadAt === undefined || change.note !== undefined,
    { message: 'noteReadAt goes with a note.', path: ['noteReadAt'] },
  );
export class UpdateTopicRequestDto extends createZodDto(
  updateTopicRequestSchema,
) {}

export const useTemplateForMeetingRequestSchema = z.strictObject({
  /** One of Thrive's template keys, or the id of a kept template, from `GET one-on-one-templates`. */
  templateKey: z.string(),
});
export class UseTemplateForMeetingRequestDto extends createZodDto(
  useTemplateForMeetingRequestSchema,
) {}

export const reorderTopicsRequestSchema = z.strictObject({
  /** Every topic on the agenda, once, in the new order. */
  topicIds: z.array(z.uuid()),
});
export class ReorderTopicsRequestDto extends createZodDto(
  reorderTopicsRequestSchema,
) {}

export const createdResponseSchema = z.object({ id: z.uuid() });
export class CreatedMeetingThingResponseDto extends createZodDto(
  createdResponseSchema,
) {}

const topicSchema = z.object({
  id: z.uuid(),
  text: z.string(),
  source: z.enum(['CARRIED', 'TEMPLATE', 'PERSON']),
  /** Who added it; `null` for one carried over or from the template. */
  authorAccountId: nullableString(),
  position: z.number().int(),
  notes: z.string(),
  /** Send this back as `noteReadAt` with a change to the note. */
  notesUpdatedAt: nullableDateTime(),
  notesUpdatedByAccountId: nullableString(),
  discussedAt: nullableDateTime(),
  /** The Profile item a person brought it from; `null` for every other topic. */
  broughtFrom: broughtFromSchema.nullable(),
  /**
   * The template that asked it, by its key, for one from a template; `null` for every other. Its
   * name is in the next meeting's `templates`.
   */
  templateKey: nullableString(),
});

/** A template a topic came from, by its key, with what it is called. */
const templateNameSchema = z.object({ key: z.string(), name: z.string() });

const meetingSchema = z.object({
  id: z.uuid(),
  state: z.enum(['PREPARING', 'IN_PROGRESS', 'FINISHED']),
  /** The template used last for it while it was prepared; `null` when none was. */
  templateKey: nullableString(),
  occursAt: nullableDateTime(),
  startedAt: nullableDateTime(),
  startedByAccountId: nullableString(),
  finishedAt: nullableDateTime(),
  finishedByAccountId: nullableString(),
  topics: z.array(topicSchema),
});

export const nextMeetingResponseSchema = z.object({
  /** The meeting not finished, or `null` before either has written to it. */
  meeting: meetingSchema.nullable(),
  /** Before then: what was not reached last time, which it will open with. */
  carried: z.array(z.string()),
  /**
   * Deprecated: always empty. A meeting no longer opens with a template's questions; either person
   * uses a template while it is prepared (`PUT …/meetings/{meetingId}/template`).
   */
  templateQuestions: z.array(z.string()).meta({ deprecated: true }),
  /**
   * Deprecated: what the template used last for the meeting is called; `null` when none was used.
   * An agenda takes several templates now, each named in `templates`.
   */
  templateName: nullableString().meta({ deprecated: true }),
  /**
   * The templates whose questions are on the meeting's agenda, each once, in agenda order, with what
   * each is called. A template in use is not used again until all its questions are removed.
   */
  templates: z.array(templateNameSchema),
  /**
   * The earliest meeting day skipped that topics on the agenda were written for, `YYYY-MM-DD` in
   * Bangkok: the agenda moved on from it to the day due. `null` when none was.
   */
  carriedFromSkipped: z.iso.date().nullable(),
  /** Each topic written for a meeting day then skipped, with that day (`YYYY-MM-DD`, Bangkok). */
  carriedTopics: z.array(z.object({ topicId: z.string(), from: z.iso.date() })),
});
export class NextMeetingResponseDto extends createZodDto(
  nextMeetingResponseSchema,
) {}

export const listPastMeetingsQuerySchema = z.strictObject(cursorQueryShape);
export class ListPastMeetingsQueryDto extends createZodDto(
  listPastMeetingsQuerySchema,
) {}

export const listPastMeetingsResponseSchema = z.object({
  /** Finished meetings, newest first, each whole. */
  items: z.array(meetingSchema),
  ...cursorResultShape,
  /**
   * The meeting days skipped, `YYYY-MM-DD` in Bangkok, oldest first: each day the schedule met on
   * that nobody started before the next one came (a week, for one held once). Only those as far back
   * as this page's oldest meeting while more pages follow; every one on the last page.
   */
  skippedDays: z.array(z.iso.date()),
  /** What each template a topic on this page came from is called, each once (`topics[].templateKey`). */
  templates: z.array(templateNameSchema),
});
export class ListPastMeetingsResponseDto extends createZodDto(
  listPastMeetingsResponseSchema,
) {}
