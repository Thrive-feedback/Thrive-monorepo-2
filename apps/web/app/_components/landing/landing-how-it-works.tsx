import { Text } from '@/components/atoms/text';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingSection } from './landing-section';
import { LandingStat } from './landing-stat';

const { howItWorks } = LANDING_COPY;

/** The loop in three steps, in the order a Member walks it, and the research behind asking. */
export function LandingHowItWorks() {
  return (
    <LandingSection
      id="how-it-works"
      eyebrow={howItWorks.eyebrow}
      title={howItWorks.title}
    >
      <ol className="grid gap-gap-grid md:grid-cols-3">
        {howItWorks.steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-2">
            <Text
              as="span"
              variant="subtitle-handwrite-1"
              className="text-action-secondary"
              aria-hidden="true"
            >
              {index + 1}
            </Text>
            <Text as="h3" variant="subtitle-2">
              {step.title}
            </Text>
            <Text variant="body-2" tone="muted">
              {step.body}
            </Text>
          </li>
        ))}
      </ol>
      <div className="grid gap-gap-grid md:grid-cols-2">
        {howItWorks.stats.map((stat) => (
          <LandingStat key={stat.figure} {...stat} />
        ))}
      </div>
    </LandingSection>
  );
}
