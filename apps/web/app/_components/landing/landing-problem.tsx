import { Text } from '@/components/atoms/text';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingSection } from './landing-section';

const { problem } = LANDING_COPY;

/** Why a team goes quiet, and why being asked is what breaks the silence. */
export function LandingProblem() {
  return (
    <LandingSection
      id="problem"
      title={problem.title}
      note={problem.note}
      lead={problem.lead}
      align="center"
    >
      <ul className="grid gap-8 md:grid-cols-3 md:gap-gap-grid">
        {problem.reasons.map((reason) => (
          <li
            key={reason.title}
            className="flex flex-col gap-2 border-border-muted border-t pt-5"
          >
            <Text as="h3" variant="subtitle-1">
              {reason.title}
            </Text>
            <Text variant="body-1" tone="muted">
              {reason.body}
            </Text>
          </li>
        ))}
      </ul>
      <Text
        variant="subtitle-display-1"
        className="mx-auto max-w-2xl text-balance text-center"
      >
        {problem.closer}
      </Text>
    </LandingSection>
  );
}
