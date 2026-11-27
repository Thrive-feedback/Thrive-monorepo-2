import {
  cursorQueryShape,
  cursorResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ONE_ON_ONE_CADENCES } from '../../domain/value-object/one-on-one-schedule.vo';
import { ONE_ON_ONE_STATUSES } from '../../domain/value-object/one-on-one-status.vo';

/**
 * A nullable string described by hand: left to itself, one on a response root comes out of the
 * contract as an array of strings (`docs/design/0016` §10), and this schema is a root on its own route.
 */
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

/** Shared by the routes under `/v1/workspaces/:workspaceId` that name no further resource. */
export const workspacePathParamsSchema = z.object({
  workspaceId: z.uuid(),
});
export class WorkspacePathParamsDto extends createZodDto(
  workspacePathParamsSchema,
) {}

/** The same path, plus the one 1:1 a route acts on. */
export const oneOnOnePathParamsSchema = z.object({
  workspaceId: z.uuid(),
  oneOnOneId: z.uuid(),
});
export class OneOnOnePathParamsDto extends createZodDto(
  oneOnOnePathParamsSchema,
) {}

/**
 * When a 1:1 meets: how often and on which day, with no time of day, as a meeting is that whole
 * day. Only the shape is checked here; which weekdays a schedule keeps, and which templates exist,
 * are the schedule's rules, each with its own code.
 */
export const oneOnOneScheduleRequestSchema = z.strictObject({
  cadence: z.enum(ONE_ON_ONE_CADENCES),
  /** 1 is Monday and 7 is Sunday. */
  weekday: z.number().int(),
  /**
   * Deprecated: leave it out. A meeting no longer opens with the schedule's template; either person
   * uses one while it is prepared (`PUT …/meetings/{meetingId}/template`). Still kept with the
   * schedule, as Thrive's Weekly check-in when left out, until the field is removed.
   */
  templateKey: z.string().optional().meta({ deprecated: true }),
  /** The day of a meeting held `ONCE`, which needs it; ignored for the other cadences. */
  startsOn: z.iso.date().optional(),
});
export class OneOnOneScheduleRequestDto extends createZodDto(
  oneOnOneScheduleRequestSchema,
) {}

export const inviteToOneOnOneRequestSchema = z.strictObject({
  /** The teammate invited, who is asked to accept it. */
  invitedAccountId: z.uuid(),
  schedule: oneOnOneScheduleRequestSchema,
  /** What the sender would like to talk about, up to 280 characters. Blank says nothing. */
  note: z.string().optional(),
});
export class InviteToOneOnOneRequestDto extends createZodDto(
  inviteToOneOnOneRequestSchema,
) {}

export const suggestAnotherTimeRequestSchema = z.strictObject({
  /** The time the person invited would rather meet. */
  schedule: oneOnOneScheduleRequestSchema,
  /** Why, or what would suit them, up to 280 characters. Blank says nothing. */
  note: z.string().optional(),
});
export class SuggestAnotherTimeRequestDto extends createZodDto(
  suggestAnotherTimeRequestSchema,
) {}

export const declineOneOnOneRequestSchema = z.strictObject({
  /** Why, up to 280 characters, for whoever sent the invitation. Blank says nothing. */
  note: z.string().optional(),
});
export class DeclineOneOnOneRequestDto extends createZodDto(
  declineOneOnOneRequestSchema,
) {}

export const createdOneOnOneResponseSchema = z.object({ id: z.uuid() });
export class CreatedOneOnOneResponseDto extends createZodDto(
  createdOneOnOneResponseSchema,
) {}

const oneOnOneScheduleSchema = z.object({
  cadence: z.enum(ONE_ON_ONE_CADENCES),
  weekday: z.number().int(),
  templateKey: z.string(),
  /**
   * What its template is called, for both people, whichever layer it is from: Thrive's, the
   * Workspace's, or either person's own.
   */
  templateName: z.string(),
  /** The calendar day of the first meeting. */
  startsOn: z.iso.date(),
});

export const oneOnOneResponseSchema = z.object({
  id: z.uuid(),
  status: z.enum(ONE_ON_ONE_STATUSES),
  /** Who sent the invitation. Once it is accepted, the two people in it are equal. */
  startedByAccountId: z.string(),
  /** Who was invited, and answers it. */
  invitedAccountId: z.string(),
  /** The other person in it, from the caller's side. */
  withAccountId: z.string(),
  schedule: oneOnOneScheduleSchema,
  /** What the sender wrote with the invitation, if anything. */
  inviteNote: nullableString(),
  /** When the person invited sent it back with another time; `null` if they never did. */
  suggestedAt: nullableDateTime(),
  /** What was written turning it down, for whoever sent it. */
  answerNote: nullableString(),
  /** When it next meets; `null` unless it is running. */
  nextMeetingAt: nullableDateTime(),
  answeredAt: nullableDateTime(),
  endedAt: nullableDateTime(),
  createdAt: z.iso.datetime({ offset: true }),
  /**
   * Whether one of its meetings has been started and not finished. A one-time 1:1 in that state is
   * not over yet, though its slot has passed: the two can still note and finish it.
   */
  meetingInProgress: z.boolean(),
});
export class OneOnOneResponseDto extends createZodDto(oneOnOneResponseSchema) {}

export const listMyOneOnOnesQuerySchema = z.strictObject(cursorQueryShape);
export class ListMyOneOnOnesQueryDto extends createZodDto(
  listMyOneOnOnesQuerySchema,
) {}

export const listMyOneOnOnesResponseSchema = z.object({
  /** In the order they were started. Whose they are is never a query parameter. */
  items: z.array(oneOnOneResponseSchema),
  ...cursorResultShape,
});
export class ListMyOneOnOnesResponseDto extends createZodDto(
  listMyOneOnOnesResponseSchema,
) {}

const oneOnOneTemplateSchema = z.object({
  /** How a schedule names it: a key for one of Thrive's, the id for a kept one. */
  key: z.string(),
  /** Thrive's own, the Workspace's, or the caller's own. */
  scope: z.enum(['THRIVE', 'WORKSPACE', 'PERSONAL']),
  name: z.string(),
  /** When to use it; empty if its writer said nothing. */
  suggestedWhen: z.string(),
  questions: z.array(z.string()),
  /** Whether the caller may change or remove it: their own, or the Workspace's for an Admin. */
  changeable: z.boolean(),
});

export const listOneOnOneTemplatesResponseSchema = z.object({
  items: z.array(oneOnOneTemplateSchema),
  /** Whether the caller may keep templates for everyone in the Workspace: an Admin. */
  mayKeepForWorkspace: z.boolean(),
});
export class ListOneOnOneTemplatesResponseDto extends createZodDto(
  listOneOnOneTemplatesResponseSchema,
) {}

export const oneOnOneTemplatePathParamsSchema = z.object({
  workspaceId: z.uuid(),
  templateId: z.uuid(),
});
export class OneOnOneTemplatePathParamsDto extends createZodDto(
  oneOnOneTemplatePathParamsSchema,
) {}

/** Limits and trimming are the template's own rules; this checks only the shape. */
const oneOnOneTemplateContentSchema = z.strictObject({
  name: z.string(),
  /** When to use it. Blank says nothing. */
  suggestedWhen: z.string().optional(),
  /**
   * The questions each agenda opens with, in order: at least one, at most 12, which the template
   * holds to. The cap here only stops a payload far past that from being read whole.
   */
  questions: z.array(z.string()).max(50),
});

export const keepOneOnOneTemplateRequestSchema =
  oneOnOneTemplateContentSchema.extend({
    /** Just the caller's, or, for an Admin, everyone's in the Workspace. */
    scope: z.enum(['WORKSPACE', 'PERSONAL']),
  });
export class KeepOneOnOneTemplateRequestDto extends createZodDto(
  keepOneOnOneTemplateRequestSchema,
) {}

export const rewriteOneOnOneTemplateRequestSchema =
  oneOnOneTemplateContentSchema;
export class RewriteOneOnOneTemplateRequestDto extends createZodDto(
  rewriteOneOnOneTemplateRequestSchema,
) {}

export const keptOneOnOneTemplateResponseSchema = z.object({ id: z.uuid() });
export class KeptOneOnOneTemplateResponseDto extends createZodDto(
  keptOneOnOneTemplateResponseSchema,
) {}
