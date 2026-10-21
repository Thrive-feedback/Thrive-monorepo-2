import { Text } from '@/components/atoms/text';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingSection } from './landing-section';

const { today } = LANDING_COPY;

/**
 * What a Member can do the day they sign in, then what is planned, kept apart and quieter so
 * nothing on the way reads as something already there.
 */
export function LandingToday() {
  return (
    <LandingSection id="today" title={today.title} note={today.note}>
      <ul className="grid gap-x-gap-grid md:grid-cols-2">
        {today.features.map((feature) => (
          <li
            key={feature.title}
            className="flex flex-col gap-1 border-border-muted border-t py-5"
          >
            <Text as="h3" variant="subtitle-1">
              {feature.title}
            </Text>
            <Text variant="body-1" tone="muted">
              {feature.body}
            </Text>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Text as="h3" variant="subtitle-3" tone="muted" className="shrink-0">
          {today.onTheWayTitle}
        </Text>
        <ul className="flex flex-wrap gap-2">
          {today.onTheWay.map((item) => (
            <li
              key={item}
              className="rounded-chip border border-border-default px-3 py-1"
            >
              <Text as="span" variant="body-2" tone="muted">
                {item}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </LandingSection>
  );
}
