import { Badge } from '@/components/atoms/badge';
import { Text } from '@/components/atoms/text';
import { HR_LANDING_COPY } from './hr-landing-copy.constant';

const { insights } = HR_LANDING_COPY;

/** A line that has gone quiet is said in the human voice's colour; the rest stay plain. */
const ROW_TONE = {
  quiet: 'font-medium text-action-secondary-hover',
  flowing: 'text-fg-secondary',
} as const;

/**
 * Insights, the Admin Dashboard HR would buy Thrive for, which is not built yet: marked Coming soon
 * (brain `ADR-0061`), with a sketch of its kind of line from a made-up team. Names and counts only,
 * never a message, as `ADR-0056` decides.
 */
export function HrLandingInsights() {
  const headingId = `${insights.id}-title`;
  return (
    <section
      id={insights.id}
      aria-labelledby={headingId}
      className="mx-auto grid w-full max-w-5xl items-center gap-12 md:grid-cols-2"
    >
      <div className="flex flex-col gap-4">
        <Badge tone="info" edged>
          {insights.badge}
        </Badge>
        <Text
          as="h2"
          id={headingId}
          variant="display-2"
          className="text-balance"
        >
          {insights.title}
        </Text>
        <Text variant="subtitle-1" tone="muted" className="text-pretty">
          {insights.lead}
        </Text>
        <Text variant="body-2" tone="muted">
          {insights.more}
        </Text>
      </div>
      <figure className="m-0 flex flex-col gap-3 rounded-element border border-action-tertiary-border border-dashed bg-action-tertiary-surface p-inset-container">
        <Text as="figcaption" variant="overline" tone="info">
          {insights.sketch.label}
        </Text>
        <ul className="flex flex-col">
          {insights.sketch.rows.map((row) => (
            <li
              key={row.who}
              className="flex justify-between gap-4 border-border-subtle border-b py-3 last:border-b-0"
            >
              <Text variant="body-1">{row.who}</Text>
              <Text
                variant="body-2"
                className={ROW_TONE[row.quiet ? 'quiet' : 'flowing']}
              >
                {row.what}
              </Text>
            </li>
          ))}
        </ul>
      </figure>
    </section>
  );
}
