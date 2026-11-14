/**
 * One message a point was read from. The kind travels with the id because the id alone cannot say
 * which it is, and a reader following a point back has to be sent to the right place.
 */
export interface SummarySource {
  readonly id: string;
  readonly kind: 'FEEDBACK' | 'KUDOS';
}

/** One thing the summary says, and the Feedback and Kudos it was read from (design 0025 D5). */
export interface SummaryPoint {
  readonly point: string;
  /** Items of the corpus. Empty only where a section is allowed no source. */
  readonly sources: readonly SummarySource[];
}

/** Which section a point belongs to. The order is the order a Member reads them in. */
export const SUMMARY_SECTIONS = [
  'themes',
  'strengths',
  'areas_to_improve',
  'suggested_actions',
] as const;

export type SummarySectionName = (typeof SUMMARY_SECTIONS)[number];

/**
 * How many points each section may hold.
 *
 * **Measured, not chosen** (design 0025 D12). Uncapped, fifty items produced forty-six points —
 * the feedback list reorganised, and longer than the list it replaces. Capped, the same corpus
 * produced sixteen and the model began *grouping*: four separate complaints about workload,
 * lateness, Slack and estimates became one point. The cap is what forces synthesis.
 */
export const SUMMARY_SECTION_CAPS: Readonly<
  Record<SummarySectionName, number>
> = {
  themes: 4,
  strengths: 4,
  areas_to_improve: 5,
  suggested_actions: 3,
};

/**
 * The one section a point may stand in with nothing behind it, and only where it follows from
 * points that do cite something.
 */
const MAY_CITE_NOTHING: SummarySectionName = 'suggested_actions';

/**
 * A section of the summary, already cut to its cap and to what it can show its working for.
 *
 * The cap is enforced here rather than left to the schema, because `maxItems` is the part of the
 * structured-output shape providers honour least evenly (ADR 0077) — so a provider that ignores
 * the instruction cannot put sixteen points in front of a Member.
 *
 * **A point that cites nothing is dropped**, everywhere but suggested actions. Provenance is what
 * the whole feature rests on — a Member checks a sentence against the message behind it — so an
 * uncited claim about a real person, in Thrive's voice, with nothing to check it against, is
 * exactly what must never reach the page. The prompt asks for a citation; this is what happens
 * when a model does not oblige, and it is dropped rather than rejecting the whole answer for the
 * same reason an over-long section is cut: the rest of the answer is still grounded.
 *
 * **Empty is a correct answer** (design 0025 D6): a section required to be non-empty is an
 * instruction to invent, and a manufactured criticism of a real person, in Thrive's voice, is the
 * worst thing this feature could do.
 */
export class SummarySection {
  private constructor(
    private readonly name: SummarySectionName,
    private readonly points: readonly SummaryPoint[],
  ) {}

  static of(
    name: SummarySectionName,
    points: readonly SummaryPoint[],
  ): SummarySection {
    const grounded =
      name === MAY_CITE_NOTHING
        ? points
        : points.filter((point) => point.sources.length > 0);
    return new SummarySection(
      name,
      grounded.slice(0, SUMMARY_SECTION_CAPS[name]),
    );
  }

  sectionName(): SummarySectionName {
    return this.name;
  }

  snapshot(): readonly SummaryPoint[] {
    return this.points;
  }
}
