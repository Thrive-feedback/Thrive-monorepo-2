import { Text } from '@/components/atoms/text';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingSection } from './landing-section';

const { today } = LANDING_COPY;

/**
 * What a team can do in Thrive, six things in `ADR-0038`'s order. Kudos, Discord and Insights are
 * listed although they are not built yet, chosen knowingly there; each is described only by what it
 * is for, never by where it sits or how fast it is.
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
    </LandingSection>
  );
}
