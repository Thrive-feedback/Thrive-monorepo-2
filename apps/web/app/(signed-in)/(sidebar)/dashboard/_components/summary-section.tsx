import { Text } from '@/components/atoms/text';
import { FEED_CARD_INK } from '@/components/organisms/feed-card/feed-card-tone.constant';
import type { FeedCardTone } from '@/components/organisms/feed-card/feed-card-tone.type';
import { cn } from '@/lib/cn.util';
import type {
  SummarySection as Section,
  SummaryPoint,
  SummarySectionName,
} from '../_lib/feedback-summary.type';
import { SummaryPointSources } from './summary-point-sources';

/**
 * Each block in the colour its cards already wear, so the page reads as part of the same product
 * rather than as a panel bolted to it: what was given unasked in the brand's colour, what was
 * asked for in the cool one, praise in the warm one.
 */
const SECTION_TONES: Readonly<Record<SummarySectionName, FeedCardTone>> = {
  themes: 'tertiary',
  strengths: 'secondary',
  areas_to_improve: 'primary',
  suggested_actions: 'tertiary',
};

/** What an empty block says. Empty is a correct answer here, so it says so rather than hiding. */
const SECTION_EMPTY: Readonly<Record<SummarySectionName, string>> = {
  themes: 'Nothing runs through it yet.',
  strengths: 'Nobody has praised anything in particular yet.',
  areas_to_improve: 'Nobody has asked you to change anything.',
  suggested_actions: 'Nothing to try from this, yet.',
};

export type SummarySectionProps = {
  section: Section;
};

/**
 * One block of the summary: its heading in its own colour, then what the model read out of the
 * Feedback, each point with the messages behind it.
 *
 * An empty block is drawn, not dropped. A section that must be filled is an instruction to
 * invent, and a made-up criticism of a real person in Thrive's voice is the worst thing this page
 * could do — so "nobody asked you to change anything" is an answer worth reading.
 */
export function SummarySection({ section }: SummarySectionProps) {
  const tone = SECTION_TONES[section.name];

  return (
    <section className="flex flex-col gap-3">
      <Text
        as="h3"
        variant="subtitle-handwrite-3"
        className={FEED_CARD_INK[tone]}
      >
        {section.title}
      </Text>
      {section.points.length === 0 ? (
        <Text as="p" variant="body-2" tone="muted">
          {SECTION_EMPTY[section.name]}
        </Text>
      ) : (
        <ul className="flex flex-col gap-4">
          {section.points.map((point) => (
            <li
              // Prose alone is not an identity: the model groups and can repeat itself, so what
              // a point was read from distinguishes two that read alike.
              key={keyOf(point)}
              className={cn(
                'border-s-2 ps-4',
                tone === 'primary' && 'border-action-primary-border',
                tone === 'secondary' && 'border-action-secondary-border',
                tone === 'tertiary' && 'border-action-tertiary-border',
              )}
            >
              <Text as="p" variant="body-1">
                {point.point}
              </Text>
              <SummaryPointSources sources={point.sources} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** A point's identity on the page: what it says, and the messages it says it from. */
function keyOf(point: SummaryPoint): string {
  return [point.point, ...point.sources.map((source) => source.id)].join('|');
}
