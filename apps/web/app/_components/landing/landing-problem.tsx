import { Text } from '@/components/atoms/text';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingSection } from './landing-section';

const { problem } = LANDING_COPY;

/** Why a team goes quiet, and why being asked is what breaks the silence. */
export function LandingProblem() {
  return (
    <LandingSection
      id="problem"
      eyebrow={problem.eyebrow}
      title={problem.title}
      lead={problem.lead}
      surface="subtle"
      accent="secondary"
    >
      <ul className="grid gap-gap-grid md:grid-cols-3">
        {problem.reasons.map((reason) => (
          <li
            key={reason.title}
            className="flex flex-col gap-2 rounded-page bg-surface-raised p-inset-card"
          >
            <Text as="h3" variant="subtitle-3">
              {reason.title}
            </Text>
            <Text variant="body-2" tone="muted">
              {reason.body}
            </Text>
          </li>
        ))}
      </ul>
      <Text variant="subtitle-display-3" className="max-w-2xl">
        {problem.closer}
      </Text>
    </LandingSection>
  );
}
