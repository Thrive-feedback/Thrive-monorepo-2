import { Text } from '@/components/atoms/text';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingSection } from './landing-section';

const { why } = LANDING_COPY;

/**
 * Why feedback goes missing, three reasons, each beside what Thrive does about it. It argues from
 * the situation, not from studies: the page cites no research.
 */
export function LandingWhy() {
  return (
    <LandingSection
      id="why"
      title={why.title}
      note={why.note}
      lead={why.lead}
      align="center"
    >
      <ul className="flex flex-col">
        {why.reasons.map((reason) => (
          <li
            key={reason.title}
            className="grid gap-3 border-border-muted border-t py-6 md:grid-cols-2 md:gap-gap-grid"
          >
            <div className="flex flex-col gap-1">
              <Text as="h3" variant="subtitle-1">
                {reason.title}
              </Text>
              <Text variant="body-1" tone="muted">
                {reason.body}
              </Text>
            </div>
            <Text variant="subtitle-2">{reason.inThrive}</Text>
          </li>
        ))}
      </ul>
      <Text
        variant="subtitle-display-1"
        className="mx-auto max-w-2xl text-balance text-center"
      >
        {why.closer}
      </Text>
    </LandingSection>
  );
}
