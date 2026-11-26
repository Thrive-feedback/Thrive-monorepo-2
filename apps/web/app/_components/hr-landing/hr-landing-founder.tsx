import { Text } from '@/components/atoms/text';
import { HR_LANDING_COPY } from './hr-landing-copy.constant';

const { founder } = HR_LANDING_COPY;

/**
 * The page's proof, since there are no customers to point at yet (brain `ADR-0061`): why the people
 * who build Thrive build it, and that a demo is a call with them. The photo is a placeholder until
 * there is one to show.
 */
export function HrLandingFounder() {
  const headingId = `${founder.id}-title`;
  return (
    <section
      id={founder.id}
      aria-labelledby={headingId}
      className="mx-auto flex w-full max-w-5xl flex-col items-start gap-10 md:flex-row md:items-center"
    >
      <div
        aria-hidden="true"
        className="flex h-56 w-44 shrink-0 -rotate-3 items-center justify-center rounded-element border border-border-default border-dashed bg-surface-raised"
      >
        <Text variant="caption" tone="muted">
          {founder.photo}
        </Text>
      </div>
      <div className="flex flex-col gap-4">
        <Text
          as="h2"
          id={headingId}
          variant="display-3"
          className="text-balance"
        >
          {founder.quote}
        </Text>
        <Text variant="subtitle-1" tone="muted" className="text-pretty">
          {founder.body}
        </Text>
        <Text
          variant="subtitle-handwrite-2"
          className="text-action-secondary-hover"
        >
          {founder.signature}
        </Text>
      </div>
    </section>
  );
}
