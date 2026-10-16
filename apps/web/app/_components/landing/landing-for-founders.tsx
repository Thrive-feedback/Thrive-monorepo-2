import { Text } from '@/components/atoms/text';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingSection } from './landing-section';
import { LandingStat } from './landing-stat';

const { founders } = LANDING_COPY;

/** What a founder without an HR team gets, and why going first matters. */
export function LandingForFounders() {
  return (
    <LandingSection
      id="for-founders"
      eyebrow={founders.eyebrow}
      title={founders.title}
      lead={founders.lead}
      surface="subtle"
      accent="secondary"
    >
      <div className="grid items-start gap-gap-grid lg:grid-cols-3">
        <ul className="flex flex-col gap-6 lg:col-span-2">
          {founders.points.map((point) => (
            <li key={point.title} className="flex flex-col gap-1">
              <Text as="h3" variant="subtitle-2">
                {point.title}
              </Text>
              <Text variant="body-2" tone="muted">
                {point.body}
              </Text>
            </li>
          ))}
        </ul>
        <LandingStat {...founders.stat} />
      </div>
    </LandingSection>
  );
}
