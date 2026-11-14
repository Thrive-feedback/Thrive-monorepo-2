import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** One quarter, `YYYY-Qn`, on UTC (design 0025 D2). */
const summaryPeriodSchema = z.string().regex(/^\d{4}-Q[1-4]$/);

export const getMyFeedbackSummaryQuerySchema = z.strictObject({
  /** The period to read. Left out, the one today falls in. */
  period: summaryPeriodSchema.optional(),
});
export class GetMyFeedbackSummaryQueryDto extends createZodDto(
  getMyFeedbackSummaryQuerySchema,
) {}

/**
 * One thing the summary says, with the Feedback and Kudos it was read from.
 *
 * `sources` is the feature's safety net, not a detail: it is what lets the Member check any
 * sentence against the message behind it, and what makes an injected claim arrive visibly
 * attached to whoever wrote it (design 0025 D5).
 */
const summaryPointSchema = z.object({
  point: z.string(),
  /**
   * The Feedback and Kudos this Member can already open, each with its kind so the page can send
   * a reader to the right place. Empty only on a suggested action.
   */
  sources: z.array(
    z.object({ id: z.uuid(), kind: z.enum(['FEEDBACK', 'KUDOS']) }),
  ),
});

const summarySchema = z.object({
  period: summaryPeriodSchema,
  generatedAt: z.iso.datetime({ offset: true }),
  /** Whether Feedback has arrived since this was written. A newer one is already on its way. */
  isStale: z.boolean(),
  /** How many Feedback and Kudos it was written from. */
  sourceCount: z.number().int(),
  /** The language the model answered in, following the messages. */
  language: z.enum(['th', 'en', 'mixed']),
  /** At most 4. */
  themes: z.array(summaryPointSchema),
  /** At most 4. */
  strengths: z.array(summaryPointSchema),
  /** At most 5, and empty is a correct answer (design 0025 D6). */
  areas_to_improve: z.array(summaryPointSchema),
  /** At most 3. */
  suggested_actions: z.array(summaryPointSchema),
});

export const feedbackSummaryResponseSchema = z.object({
  /**
   * `null` when nothing is written yet, or when too little Feedback exists for a summary to be
   * worth one (design 0025 D7). The page shows the Feedback itself instead.
   *
   * A nullable body rather than the 204 design 0025 §5 proposed: the generated client cannot
   * tell a 204 from a failure without reading the status by hand, and `ZodResponse` ties one
   * schema to one handler — the pair that keeps the contract, the types and the runtime
   * agreeing (`GEN_08`). Nothing about the feature turns on it.
   */
  summary: summarySchema.nullable(),
  /**
   * Whether a summary can be written at all here (ADR 0085). `false` where this deployment has
   * no model provider, so the page can say that rather than telling somebody there is not enough
   * written to them — which would be a falsehood about their own Feedback.
   */
  isAvailable: z.boolean(),
});
export class FeedbackSummaryResponseDto extends createZodDto(
  feedbackSummaryResponseSchema,
) {}
