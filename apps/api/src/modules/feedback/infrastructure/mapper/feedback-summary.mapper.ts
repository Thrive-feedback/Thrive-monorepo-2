import type { FeedbackSummary as FeedbackSummaryRecord } from '@app/infrastructure/database/generated/client';
import { Logger } from '@nestjs/common';
import { z } from 'zod';
import type {
  FeedbackSummary,
  FeedbackSummarySnapshot,
} from '../../domain/entity/feedback-summary.entity';
import {
  SUMMARY_SECTIONS,
  type SummaryPoint,
  type SummarySectionName,
  type SummarySource,
} from '../../domain/value-object/summary-section.vo';

/** The only place that knows both the stored row and the summary entity. */

const logger = new Logger('FeedbackSummaryMapper');

const storedPoint = z.object({
  point: z.string(),
  sources: z.array(
    z.object({ id: z.string(), kind: z.enum(['FEEDBACK', 'KUDOS']) }),
  ),
});

/**
 * The stored shape, read back without the limits that applied when it was written: a cap or a
 * section list changed later must not stop an older summary being read. An unreadable row is
 * treated as no summary at all — it is derived, so the next refresh replaces it.
 */
const storedContent = z.object({
  language: z.enum(['th', 'en', 'mixed']),
  sections: z.record(z.string(), z.array(storedPoint)),
});

/**
 * What is stored in `content`: the model's language and its sections, ids and no message text.
 * Written as plain mutable JSON because that is what the driver takes; the entity's own shape
 * stays readonly.
 */
export type StoredSummaryContent = {
  // A type alias rather than an interface: only an alias carries the implicit index signature
  // the driver's JSON input type asks for.
  language: FeedbackSummarySnapshot['language'];
  sections: Record<
    SummarySectionName,
    { point: string; sources: { id: string; kind: SummarySource['kind'] }[] }[]
  >;
};

export function toFeedbackSummaryRecord(summary: FeedbackSummary): Omit<
  FeedbackSummaryRecord,
  'createdAt' | 'updatedAt' | 'content'
> & {
  readonly content: StoredSummaryContent;
} {
  const written = summary.snapshot();
  return {
    id: written.id,
    accountId: written.accountId,
    workspaceId: written.workspaceId,
    period: written.period,
    content: {
      language: written.language,
      sections: Object.fromEntries(
        SUMMARY_SECTIONS.map((name) => [
          name,
          written.sections[name].map((entry) => ({
            point: entry.point,
            sources: entry.sources.map((source) => ({ ...source })),
          })),
        ]),
      ) as StoredSummaryContent['sections'],
    },
    promptVersion: written.promptVersion,
    sourceCount: written.sourceCount,
    sourceWatermark: written.sourceWatermark,
    generatedAt: written.generatedAt,
  };
}

/** Builds every section in reading order, so a missing key and an empty one read the same. */
function sectionsOf(
  pointsOf: (name: SummarySectionName) => readonly SummaryPoint[],
): Readonly<Record<SummarySectionName, readonly SummaryPoint[]>> {
  return {
    themes: pointsOf('themes'),
    strengths: pointsOf('strengths'),
    areas_to_improve: pointsOf('areas_to_improve'),
    suggested_actions: pointsOf('suggested_actions'),
  };
}

export function toFeedbackSummarySnapshot(
  record: FeedbackSummaryRecord,
): FeedbackSummarySnapshot | null {
  const parsed = storedContent.safeParse(record.content);
  if (!parsed.success) {
    logger.warn({
      event: 'feedback.summary_unreadable',
      summaryId: record.id,
    });
    return null;
  }
  const stored = parsed.data.sections;
  return {
    id: record.id,
    accountId: record.accountId,
    workspaceId: record.workspaceId,
    period: record.period,
    language: parsed.data.language,
    sections: sectionsOf((name) => stored[name] ?? []),
    sourceCount: record.sourceCount,
    sourceWatermark: record.sourceWatermark,
    promptVersion: record.promptVersion,
    generatedAt: record.generatedAt,
  };
}
