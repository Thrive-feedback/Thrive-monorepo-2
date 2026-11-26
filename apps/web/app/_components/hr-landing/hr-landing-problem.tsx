import { LandingSection } from '@/app/_components/landing/landing-section';
import { Text } from '@/components/atoms/text';
import { HR_LANDING_COPY } from './hr-landing-copy.constant';

const { problem } = HR_LANDING_COPY;

/** What HR runs today, a Google Form, and the three ways it lets them down. */
export function HrLandingProblem() {
  return (
    <LandingSection
      id={problem.id}
      title={problem.title}
      note={problem.note}
      lead={problem.lead}
    >
      <ul className="grid gap-5 md:grid-cols-3">
        {problem.items.map((item) => (
          <li
            key={item.title}
            className="flex flex-col gap-2 rounded-element border border-border-muted bg-surface-base p-inset-container"
          >
            <Text as="h3" variant="subtitle-display-2">
              {item.title}
            </Text>
            <Text variant="body-1" tone="muted">
              {item.body}
            </Text>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
