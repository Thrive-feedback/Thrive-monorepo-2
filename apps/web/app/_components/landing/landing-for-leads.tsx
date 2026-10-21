import { Text } from '@/components/atoms/text';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingSection } from './landing-section';

const { leads } = LANDING_COPY;

/** What whoever leads the team gets, and why going first matters. */
export function LandingForLeads() {
  return (
    <LandingSection
      id="for-leads"
      title={leads.title}
      note={leads.note}
      lead={leads.lead}
      layout="split"
    >
      <ul className="flex flex-col">
        {leads.points.map((point) => (
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
