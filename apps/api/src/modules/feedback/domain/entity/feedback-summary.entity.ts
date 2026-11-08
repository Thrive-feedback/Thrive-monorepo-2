import type { SummaryPeriod } from '../value-object/summary-period.vo';
import type {
  SummaryPoint,
  SummarySection,
  SummarySectionName,
} from '../value-object/summary-section.vo';

/** Which language the summary is written in, as the model reported it. */
export type SummaryLanguage = 'th' | 'en' | 'mixed';

export interface FeedbackSummarySnapshot {
  readonly id: string;
  readonly accountId: string;
  readonly workspaceId: string;
  readonly period: string;
  readonly language: SummaryLanguage;
  readonly sections: Readonly<
    Record<SummarySectionName, readonly SummaryPoint[]>
  >;
  readonly sourceCount: number;
  readonly sourceWatermark: Date;
  readonly promptVersion: number;
  readonly generatedAt: Date;
}

/**
 * What the Feedback written to one Member over one period adds up to, written by a model from
 * that Member's own Feedback and Kudos — and readable by nobody else (brain `ADR-0051` d7).
 *
 * Its own aggregate root: written whole and replaced whole, never edited point by point. Every
 * point carries the ids it was read from, which is at once the groundedness check, the defence
 * against a Giver's text speaking in Thrive's voice, and what lets a Member check any sentence
 * against the message behind it (design 0025 D5).
 */
export class FeedbackSummary {
  private constructor(
    private readonly id: string,
    private readonly accountId: string,
    private readonly workspaceId: string,
    private readonly period: SummaryPeriod,
    private readonly language: SummaryLanguage,
    private readonly sections: readonly SummarySection[],
    private readonly sourceCount: number,
    private readonly sourceWatermark: Date,
    private readonly promptVersion: number,
    private readonly generatedAt: Date,
  ) {}

  static written(details: {
    readonly id: string;
    readonly accountId: string;
    readonly workspaceId: string;
    readonly period: SummaryPeriod;
    readonly language: SummaryLanguage;
    readonly sections: readonly SummarySection[];
    readonly sourceCount: number;
    /** The newest source it was written from; anything newer makes it stale. */
    readonly sourceWatermark: Date;
    readonly promptVersion: number;
    readonly generatedAt: Date;
  }): FeedbackSummary {
    return new FeedbackSummary(
      details.id,
      details.accountId,
      details.workspaceId,
      details.period,
      details.language,
      details.sections,
      details.sourceCount,
      details.sourceWatermark,
      details.promptVersion,
      details.generatedAt,
    );
  }

  snapshot(): FeedbackSummarySnapshot {
    const bySection = new Map(
      this.sections.map((section) => [
        section.sectionName(),
        section.snapshot(),
      ]),
    );
    return {
      id: this.id,
      accountId: this.accountId,
      workspaceId: this.workspaceId,
      period: this.period.toString(),
      language: this.language,
      // Every section appears, in reading order, whether or not the model filled it: a missing
      // key and an empty one would otherwise say different things to the page.
      sections: {
        themes: bySection.get('themes') ?? [],
        strengths: bySection.get('strengths') ?? [],
        areas_to_improve: bySection.get('areas_to_improve') ?? [],
        suggested_actions: bySection.get('suggested_actions') ?? [],
      },
      sourceCount: this.sourceCount,
      sourceWatermark: this.sourceWatermark,
      promptVersion: this.promptVersion,
      generatedAt: this.generatedAt,
    };
  }
}
