import { Text } from '@/components/atoms/text';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingSection } from './landing-section';

const { founders } = LANDING_COPY;

/** What a founder without an HR team gets, and why going first matters. */
export function LandingForFounders() {
  return (
    <LandingSection
      id="for-founders"
      title={founders.title}
      note={founders.note}
      lead={founders.lead}
      layout="split"
    >
      <ul className="flex flex-col">
        {founders.points.map((point) => (
          <li
            key={point.title}
            className="flex flex-col gap-2 border-border-muted border-t py-5"
          >
            <Text as="h3" variant="subtitle-1">
              {point.title}
            </Text>
            <Text variant="body-1" tone="muted">
              {point.body}
            </Text>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
